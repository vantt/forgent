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
  const readHook = fixture(t, '.githooks/pre-commit', '#!/usr/bin/env node\n' + SOURCE.replace("['ls-tree', ref]", "['--no-replace-objects', ...ref]").replace("readTree('HEAD')", "readTree(['ls-tree', 'HEAD'])"));
  const verbs = ['ls-tree'];
  readHook.declare([{ ...readHook.entry, class: 'hook-read-context', verbs }]);
  assert.deepEqual(scan({ root: readHook.root }).classes[0].verbs, verbs);
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

// The fixed-argv cases above cannot observe caller growth through a pass-through wrapper.
// These shapes reproduce the tooling, callback and cold-hook declaration boundaries.
const WRAPPERS = [
  {
    name: 'tooling wrapper', path: 'scripts/read.mjs',
    source: "import { execFileSync } from 'node:child_process';\nfunction git(root, args) { return execFileSync('git', args, { cwd: root }); }\ngit('.', ['ls-tree', 'HEAD']);\n",
    caller: (argv) => `git('.', ${argv});\n`,
    escapingCallers: [
      "git.call(null, '.', ['reset', '--hard', 'HEAD']);",
      "Reflect.apply(git, null, ['.', ['reset', '--hard', 'HEAD']]);",
      "const tbl = [git]; tbl[0]('.', ['reset', '--hard', 'HEAD']);",
    ],
  },
  {
    name: 'callback wrapper', path: 'scripts/read.mjs',
    source: "import { spawnSync } from 'node:child_process';\nfunction runOrThrow(command, args, options) { return spawnSync(command, args, options); }\nexport function verify(root, deps = {}) {\n  const run = deps.run || ((command, args) => runOrThrow(command, args, { cwd: root }));\n  run('git', ['diff', '--check', 'base..end']);\n}\nverify('.');\n",
    caller: (argv) => `run('git', ${argv});\n`,
    escapingCallers: [
      "run.call(null, 'git', ['push', '--force', 'origin', 'HEAD']);",
      "Reflect.apply(run, null, ['git', ['push', '--force', 'origin', 'HEAD']]);",
      "const tbl = [run]; tbl[0]('git', ['push', '--force', 'origin', 'HEAD']);",
    ],
    change: (source, call) => source.replace("  run('git', ['diff', '--check', 'base..end']);", `  run('git', ['diff', '--check', 'base..end']);\n  ${call}`),
  },
  {
    name: 'cold-hook callback', path: '.githooks/pre-commit',
    source: "#!/usr/bin/env node\nimport { execFileSync } from 'node:child_process';\nimport { guard } from '../src/guard.mjs';\nfunction leaseGitRead(args) { return execFileSync('git', ['--no-replace-objects', ...args]); }\nguard({ git: leaseGitRead });\n",
    other: "export function guard({ git }) { return git(['ls-tree', 'HEAD']); }\n",
    caller: (argv) => `git(${argv});\n`,
    escapingCallers: [
      "git.call(null, ['update-ref', 'refs/heads/main', 'HEAD']);",
      "Reflect.apply(git, null, [['update-ref', 'refs/heads/main', 'HEAD']]);",
      "const tbl = [git]; tbl[0](['update-ref', 'refs/heads/main', 'HEAD']);",
    ],
    changeOther: (source, call) => source.replace('return git(', `${call} return git(`),
    class: 'hook-read-context', verbs: ['ls-tree'],
  },
];
function wrapperFixture(t, shape) {
  const f = fixture(t, shape.path, shape.source);
  if (shape.other) f.write('src/guard.mjs', shape.other);
  const raw = scan({ root: f.root }).sites;
  assert.equal(raw.length, 1, shape.name);
  f.entry = { ...f.entry, siteId: raw[0].siteId, ...(shape.class ? { class: shape.class, verbs: shape.verbs } : {}) };
  const change = (call) => {
    if (shape.other) f.write('src/guard.mjs', shape.changeOther(shape.other, call));
    else f.write(shape.path, shape.change ? shape.change(shape.source, call) : shape.source + call);
  };
  return { ...f, change };
}

test('new or changed write callers cannot inherit any declared pass-through wrapper', (t) => {
  for (const shape of WRAPPERS) {
    for (const argv of ["['reset', '--hard', 'HEAD']", "['push', '--force', 'origin', 'HEAD']"]) {
      const f = wrapperFixture(t, shape);
      f.declare([f.entry]);
      assert.deepEqual(scan({ root: f.root }).sites, [], `${shape.name}: baseline`);
      f.change(shape.caller(argv));
      assert.throws(() => scan({ root: f.root }), /stale or ambiguous Git declaration/, `${shape.name}: ${argv}`);
    }
    const f = wrapperFixture(t, shape);
    f.declare([f.entry]);
    const target = shape.other ? 'src/guard.mjs' : shape.path;
    f.write(target, (shape.other ?? shape.source).replace("'ls-tree'", "'reset'").replace("'diff', '--check'", "'push', '--force'"));
    assert.throws(() => scan({ root: f.root }), /stale or ambiguous Git declaration/, `${shape.name}: changed caller`);
  }
});

// Ordinary caller fingerprints above cannot prove refusal when value flow reports an escape.
test('call, Reflect.apply and array-slot callers refuse declared pass-through wrappers', async (t) => {
  for (const shape of WRAPPERS) {
    for (const call of shape.escapingCallers) {
      await t.test(`${shape.name}: ${call}`, (t) => {
        const f = wrapperFixture(t, shape);
        f.declare([f.entry]);
        assert.deepEqual(scan({ root: f.root }).sites, [], 'baseline declaration matches');
        f.change(call);
        assert.throws(() => scan({ root: f.root }), /invalid Git declaration: wrapper escapes/, 'an unresolved caller cannot inherit the declaration');
      });
    }
  }
});

// The literal-site class check cannot see a fixed program passed through the verifier callback.
test('configured declarations refuse fixed Git callback programs, including escaping write callers', async (t) => {
  const shape = WRAPPERS[1];
  for (const call of ['', ...shape.escapingCallers]) {
    await t.test(call || 'resolved literal git caller', (t) => {
      const f = wrapperFixture(t, shape);
      if (call) f.change(call);
      f.declare([]);
      const [site] = scan({ root: f.root }).sites;
      f.declare([{ ...f.entry, siteId: site.siteId, class: 'configured-binary' }]);
      assert.throws(() => scan({ root: f.root }), /invalid Git declaration.*(?:fixed program|wrapper escapes)/);
    });
  }
});

// Configured-binary used to exempt every escape, even without any configuration provenance.
test('configured declarations refuse escaping program parameters even with a known config caller', async (t) => {
  for (const program of ['unresolvedConfig()', 'JSON.parse(process.env.COMMANDS).command']) {
    await t.test(program, (t) => {
      const source = `import { execFileSync } from 'node:child_process';\nfunction verify(command) { execFileSync(command, { shell: true }); }\nverify(${program});\nverify.call(null, 'git');\n`;
      const f = fixture(t, 'scripts/read.mjs', source);
      f.declare([{ ...f.entry, class: 'configured-binary' }]);
      assert.throws(() => scan({ root: f.root }), /invalid Git declaration: wrapper escapes/);
    });
  }
});

// This is the indexed-config shape behind the five retiring configured declarations. No other
// declaration test proves their provenance independently of an owner-supplied class label.
test('indexed returned configuration proves the program without trusting an escaping outer caller', (t) => {
  const f = fixture(t);
  const source = `import { execFileSync } from 'node:child_process';
function readConfig() { return JSON.parse(process.env.CONFIG); }
function commands(key) { const section = readConfig()[key]; return section.commands; }
function verify(root) { for (const command of commands('checks')) execFileSync(command, { shell: true, cwd: root }); }
verify('.');
verify.call(null, '.');
`;
  f.write('scripts/read.mjs', source);
  f.declare([]);
  const result = scan({ root: f.root });
  assert.deepEqual(result.sites, []);
  assert.equal(result.classes[0].class, 'configured-binary');
  f.write('scripts/read.mjs', source.replace('JSON.parse(process.env.CONFIG)', "{ checks: { commands: ['git'] } }"));
  assert.ok(scan({ root: f.root }).sites.length, 'the same computed property cannot turn a fixed Git default into config');
});

// A valid digest/rationale is not evidence of a tooling read; the hook test owns only hook claims.
test('tooling declarations reject literal writes and non-literal caller verbs', async (t) => {
  for (const argv of ["['update-ref', 'refs/heads/x', 'HEAD']", 'unresolvedArgs()', "[verb, 'HEAD']", "[...prefix, 'diff', 'HEAD']", "['symbolic-ref', ...operands]"]) {
    for (const wrapper of [false, true]) {
      await t.test(`${wrapper ? 'wrapper' : 'literal site'}: ${argv}`, (t) => {
        const source = wrapper
          ? `import { execFileSync } from 'node:child_process';\nfunction g(args) { return execFileSync('git', args, {}); }\ng(${argv});\n`
          : `import { execFileSync } from 'node:child_process';\nfunction g() { return execFileSync('git', ${argv}, {}); }\ng();\n`;
        const f = fixture(t, 'scripts/read.mjs', source);
        f.declare([f.entry]);
        assert.throws(() => scan({ root: f.root }), /invalid Git declaration.*tooling read verbs/);
      });
    }
  }
});

// The caller resolver does not follow export aliases; refuse rather than declare a hidden write safe.
test('declared wrappers refuse aliased and default exports with undeclared reset callers', async (t) => {
  for (const [exported, imported] of [
    ['export { g as alias };', "import { alias } from './read.mjs'; alias(['reset', '--hard']);"],
    ['export { g as default };', "import alias from './read.mjs'; alias(['reset', '--hard']);"],
  ]) {
    for (const argv of ['args', "['ls-tree', 'HEAD']"]) {
      await t.test(`${exported} with ${argv}`, (t) => {
        const source = `import { execFileSync } from 'node:child_process';\nfunction g(args) { return execFileSync('git', ${argv}, {}); }\ng(['ls-tree', 'HEAD']);\n`;
        const f = fixture(t, 'scripts/read.mjs', source);
        f.declare([f.entry]);
        assert.deepEqual(scan({ root: f.root }).sites, [], 'baseline declaration matches');
        f.write('scripts/read.mjs', source + exported + '\n');
        f.write('scripts/caller.mjs', imported + '\n');
        assert.throws(() => scan({ root: f.root }), /invalid Git declaration: wrapper escapes/);
      });
    }
  }
});

test('wrapper caller identities survive line shifts but an added read caller needs a new declaration', (t) => {
  for (const shape of WRAPPERS) {
    const f = wrapperFixture(t, shape);
    f.declare([f.entry]);
    f.write(shape.path, shape.source.startsWith('#!')
      ? shape.source.replace('\n', '\n\n// shifted wrapper\n')
      : '\n// shifted wrapper\n' + shape.source);
    if (shape.other) f.write('src/guard.mjs', '\n// shifted caller\n' + shape.other);
    assert.deepEqual(scan({ root: f.root }).sites, [], `${shape.name}: line shifts`);
    f.change(shape.caller("['ls-tree', 'other-ref']"));
    assert.throws(() => scan({ root: f.root }), /stale or ambiguous Git declaration/, `${shape.name}: added read`);
    f.declare([]);
    const [site] = scan({ root: f.root }).sites;
    assert.notEqual(site.siteId, f.entry.siteId);
    f.declare([{ ...f.entry, siteId: site.siteId }]);
    assert.deepEqual(scan({ root: f.root }).sites, [], `${shape.name}: explicitly re-declared`);
  }
});

test('caller fingerprints bind computed callees and duplicates but not caller ordering', (t) => {
  // Neither a direct-call-only lookup nor an unordered set of call texts proves this boundary.
  const shape = WRAPPERS[0];
  const first = "table['launch']('.', ['ls-tree', 'HEAD']);\n";
  const second = "table['launch']('.', ['ls-tree', 'other']);\n";
  const source = shape.source.replace("git('.', ['ls-tree', 'HEAD']);\n", 'const table = { launch: git };\n' + first + second);
  const f = fixture(t, shape.path, source);
  f.declare([f.entry]);
  f.write(shape.path, source.replace(first + second, second + first));
  assert.deepEqual(scan({ root: f.root }).sites, [], 'the sorted caller multiset is order independent');
  f.write(shape.path, source + first);
  assert.throws(() => scan({ root: f.root }), /stale or ambiguous Git declaration/, 'an identical new caller still changes the multiset');
  f.write(shape.path, source.replaceAll("['launch']", "[\"launch\"]"));
  assert.throws(() => scan({ root: f.root }), /stale or ambiguous Git declaration/, 'the complete computed callee is hashed, not just its parentheses');
});

test('declared hook verbs must equal observed literal caller verbs even after re-declaration', (t) => {
  const shape = WRAPPERS[2];
  const f = wrapperFixture(t, shape);
  for (const verbs of [['show'], ['ls-tree', 'show']]) {
    f.declare([{ ...f.entry, verbs }]);
    assert.throws(() => scan({ root: f.root }), /invalid Git declaration.*hook read verbs/, 'a read-only claim is not proof of the callers');
  }
  for (const argv of ["['reset', '--hard']", 'unresolvedArgs()', "['symbolic-ref', 'HEAD', 'refs/heads/main']"]) {
    f.change(shape.caller(argv));
    f.declare([]);
    const [site] = scan({ root: f.root }).sites;
    f.declare([{ ...f.entry, siteId: site.siteId }]);
    assert.throws(() => scan({ root: f.root }), /invalid Git declaration.*hook read verbs/, 'refreshing the digest cannot label unknown or write argv as a read');
  }
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
