// The declaration contract is new; test/git/one-door.test.mjs still owns automatic value-flow
// classification and ordinary census drift. This file owns exact, expiring declaration matching.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { scan, census, verifyCensus } from '../../scripts/git-one-door-scan.mjs';

const DECLARATIONS = 'scripts/lib/git-one-door-declarations.v1.json';
const SOURCE = "import { execFileSync } from 'node:child_process';\nfunction readTree(ref) { return execFileSync('git', ['ls-tree', ref]); }\nreadTree('HEAD');\n";
function fixture(t, name = 'scripts/read.mjs', source = SOURCE) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-declarations-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (file, text) => { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), text); };
  write(name, source);
  const declare = (declarations) => write(DECLARATIONS, JSON.stringify({ schema: 'git-one-door-declarations.v1', declarations }));
  const site = scan({ root }).sites[0];
  const entry = { path: name, siteId: site.siteId, class: 'declared-tooling-exemption', reason: 'This frozen evidence reader has no equivalent typed fact.', retireWhen: 'The evidence reader and its proof retire together.' };
  return { root, write, declare, entry };
}

test('a declaration classifies exactly one call, retains its rationale, and survives line shifts', (t) => {
  const f = fixture(t);
  assert.match(f.entry.siteId, /^readTree:[a-f0-9]{64}$/);
  f.declare([f.entry]);
  f.write('scripts/read.mjs', '\n// unrelated lines inserted before the call\n' + SOURCE);
  const result = scan({ root: f.root });
  assert.deepEqual(result.sites, []);
  assert.equal(result.classes.length, 1);
  assert.deepEqual(result.classes[0], { path: f.entry.path, line: 4, spawn: 'execFileSync', binary: 'git', family: 'spawn', callers: ['scripts/read.mjs:5'], ...f.entry });
  assert.equal(result.classCounts['declared-tooling-exemption'], 1);
  f.write('scripts/other.mjs', SOURCE);
  assert.deepEqual(scan({ root: f.root }).sites.map(s => s.path), ['scripts/other.mjs'], 'a matching call in another path is not exempt');
  f.write('scripts/read.mjs', SOURCE + "execFileSync('git', ['reset', '--hard']);\n");
  assert.deepEqual(scan({ root: f.root }).sites.map(s => s.path).sort(), ['scripts/other.mjs', 'scripts/read.mjs'], 'a new call in the declared path is not exempt');
});

test('deleted, edited, renamed, or ambiguous declared calls fail closed instead of reusing a line number', (t) => {
  for (const changed of ['', SOURCE.replace("['ls-tree', ref]", "['reset', '--hard']"), SOURCE.replaceAll('readTree', 'readOther'), SOURCE.replace("return execFileSync('git', ['ls-tree', ref]);", "execFileSync('git', ['ls-tree', ref]); return execFileSync('git', ['ls-tree', ref]);")]) {
    const f = fixture(t);
    f.declare([f.entry]);
    f.write('scripts/read.mjs', changed);
    assert.throws(() => scan({ root: f.root }), /stale or ambiguous Git declaration/);
  }
});

test('declarations reject duplicate keys, path patterns, unknown classes, empty reasons and invalid hook verbs', (t) => {
  const f = fixture(t);
  const invalid = [
    [f.entry, f.entry],
    [{ ...f.entry, path: 'scripts/*.mjs' }],
    [{ ...f.entry, path: '../scripts/read.mjs' }],
    [{ ...f.entry, siteId: '' }],
    [{ ...f.entry, class: 'git-driver' }],
    [{ ...f.entry, reason: ' ' }],
    [{ ...f.entry, retireWhen: '' }],
    [{ ...f.entry, class: 'configured-binary' }], // a fixed Git program is not consumer config
    [{ ...f.entry, class: 'hook-read-context', verbs: ['ls-tree'] }], // not a hook
  ];
  for (const entries of invalid) {
    f.declare(entries);
    assert.throws(() => scan({ root: f.root }), /invalid Git declaration/);
  }
  for (const bytes of ['{', JSON.stringify({ schema: 'wrong', declarations: [] })]) {
    f.write(DECLARATIONS, bytes);
    assert.throws(() => scan({ root: f.root }), /invalid Git declaration/);
  }
  const hook = fixture(t, '.githooks/pre-commit', '#!/usr/bin/env node\n' + SOURCE.replace("['ls-tree', ref]", "['--no-replace-objects', ...ref]"));
  for (const verbs of [[], ['reset'], ['show-ref', 'diff-tree', 'symbolic-ref write']]) {
    hook.declare([{ ...hook.entry, class: 'hook-read-context', verbs }]);
    assert.throws(() => scan({ root: hook.root }), /invalid Git declaration/);
  }
  const verbs = ['cat-file', 'ls-tree', 'show-ref', 'diff', 'show', 'symbolic-ref read', 'rev-parse', 'diff-tree', 'rev-list'];
  hook.declare([{ ...hook.entry, class: 'hook-read-context', verbs }]);
  assert.deepEqual(scan({ root: hook.root }).classes[0].verbs, verbs);
});

test('the hook read set adds only show-ref and diff-tree and still rejects their mutating neighbours', (t) => {
  const f = fixture(t, '.githooks/pre-commit', "#!/bin/sh\ngit show-ref --verify refs/heads/main\ngit diff-tree HEAD\ngit update-ref refs/heads/main HEAD\ngit symbolic-ref HEAD refs/heads/main\n");
  const result = scan({ root: f.root });
  assert.deepEqual(result.classes.map(s => s.verbs), [['show-ref'], ['diff-tree']]);
  assert.deepEqual(result.sites.map(s => s.line), [4, 5]);
});

test('an explicitly declared unresolved consumer command uses the existing configured-binary class', (t) => {
  const f = fixture(t, 'scripts/read.mjs', "import { execFileSync } from 'node:child_process';\nfunction verify() { execFileSync(unresolvedConfig(), { shell: true }); }\nverify();\n");
  f.declare([{ ...f.entry, class: 'configured-binary' }]);
  const result = scan({ root: f.root });
  assert.deepEqual(result.sites, []);
  assert.equal(result.classes[0].class, 'configured-binary');
});

test('the census binds declaration bytes so doctor rejects missing or changed declarations', (t) => {
  const f = fixture(t);
  f.declare([f.entry]);
  const doc = census(scan({ root: f.root }));
  assert.equal(typeof doc.files[DECLARATIONS], 'string');
  assert.equal(verifyCensus(doc, f.root).passed, true);
  f.declare([{ ...f.entry, reason: 'Changed after the build.' }]);
  assert.match(verifyCensus(doc, f.root).message, /not built from this payload.*git-one-door-declarations/);
  fs.unlinkSync(path.join(f.root, DECLARATIONS));
  assert.match(verifyCensus(doc, f.root).message, /git-one-door-declarations.*missing/);
});
