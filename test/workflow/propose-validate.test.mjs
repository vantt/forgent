// test/workflow/propose-validate.test.mjs — a proposal checked against the repository: what it refuses, and what it adds

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  validateProposal,
  createRepoPorts,
  ProposeValidateError,
  TEST_SCAN_LIMITS,
} from '../../src/workflow/propose-validate.mjs';
import { classifySlice } from '../../src/workflow/propose-classify.mjs';
import { globsMeet } from '../../src/runner/dispatch/write-scope.mjs';
import { proposeFrame } from '../../src/workflow/propose-frame.mjs';
import { shippedCatalog } from '../../src/runner/dispatch/shipped-catalog.mjs';
import { readStandardValue } from '../../src/config/facade.mjs';

// A repository in memory: file path -> text. Directories exist because a file lies below them.
function memoryPorts(files, { links = [] } = {}) {
  const names = Object.keys(files);
  const segments = (p) => p.split('/').filter(Boolean);
  const stat = (p) => {
    if (p === '.') return 'dir';
    if (links.some((link) => p === link || p.startsWith(`${link}/`))) return 'link';
    if (Object.hasOwn(files, p)) return 'file';
    return names.some((name) => name.startsWith(`${p}/`)) ? 'dir' : null;
  };
  const listFiles = (scope) => {
    if (scope === '.') return [...names].sort();
    const found = stat(scope);
    if (found === 'file') return [scope];
    if (found === 'dir') return names.filter((name) => name.startsWith(`${scope}/`)).sort();
    return names.filter((name) => globsMeet(segments(name), segments(scope))).sort();
  };
  const findTests = (terms) => names.filter((name) => name.startsWith('test/') && terms.some((term) => files[name].includes(term))).sort();
  const crateOf = (file) => {
    const parts = file.split('/').slice(0, -1);
    for (let depth = parts.length; depth > 0; depth -= 1) {
      const dir = parts.slice(0, depth).join('/');
      const name = /name = "([^"]+)"/.exec(files[`${dir}/Cargo.toml`] ?? '')?.[1];
      if (name) return { dir, name };
    }
    return null;
  };
  return { stat, listFiles, findTests, crateOf };
}

const runnerConfig = {
  capabilities: { 'code:implement': {}, 'code:test': {}, 'docs:write': {}, review: { aliases: ['peer-review'] } },
};

const repo = {
  'src/a/one.mjs': 'export const one = 1;\n',
  'src/a/two.mjs': 'export const two = 2;\n',
  'src/b/three.mjs': 'export const three = 3;\n',
  'test/a/one.test.mjs': "import { one } from '../../src/a/one.mjs';\n",
  'test/a/shared.test.mjs': "import '../../src/a/one.mjs'; import '../../src/b/three.mjs';\n",
  'test/b/three.test.mjs': "import { three } from '../../src/b/three.mjs';\n",
  'docs/guide.md': '# guide\n',
};

const slice = (id, writes, extra = {}) => ({ id, writes, rigor: 'standard', capability: 'code:implement', pattern: 'reviewed', unresolvedScopes: [], ...extra });
const validate = (slices, extra = {}) => validateProposal({ slices, runnerConfig, ports: memoryPorts(repo), ...extra });
const codes = (result) => result.refusals.map((r) => r.code);

test('a sound proposal passes, with the tests of the changed code listed as an addition', () => {
  const result = validate([slice('a', ['src/a/one.mjs'])]);
  assert.equal(result.ok, true);
  assert.deepEqual(result.refusals, []);
  assert.deepEqual(result.expansions.map((e) => e.add), [['test/a/one.test.mjs', 'test/a/shared.test.mjs']]);
});

test('a proposal with no slice, or a floor that is no rigor, is a programming error, not a refusal', () => {
  assert.throws(() => validate([]), (err) => err instanceof ProposeValidateError && err.code === 'no-slices');
  assert.throws(() => validate([slice('x', ['src/a/one.mjs'])], { rigorFloor: 'fast' }), (err) => err.code === 'floor-invalid');
});

test('a scope judged without the files below it is refused as unresolved', () => {
  const result = validate([slice('a', ['src/a'], { unresolvedScopes: ['src/a'] })]);
  assert.deepEqual(codes(result), ['unresolved-scope']);
  assert.deepEqual(result.refusals[0].scopes, ['src/a']);
});

test('a write path that is absolute or leaves the repository is refused as invalid', () => {
  const result = validate([slice('a', ['/etc/passwd']), slice('b', ['../outside/file.mjs'])]);
  assert.deepEqual(codes(result), ['write-path-invalid', 'write-path-invalid']);
});

test('a write path the write-scope reader would not read the same way is refused as invalid', () => {
  const result = validate([slice('a', ['src\\a\\one.mjs']), slice('b', ['src/a**.mjs']), slice('c', [':(glob)src/a/one.mjs'])]);
  assert.deepEqual(codes(result), ['write-path-invalid', 'write-path-invalid', 'write-path-invalid']);
});

test('a write under the repository bookkeeping or installed dependencies is refused as forbidden, at any depth', () => {
  const result = validate([slice('a', ['node_modules/pkg/index.js']), slice('b', ['.git/hooks/pre-commit']), slice('c', ['src/a/node_modules/x.js'])]);
  assert.deepEqual(codes(result), ['write-path-forbidden', 'write-path-forbidden', 'write-path-forbidden']);
});

test('a glob that can reach a forbidden tree is refused, one that cannot is not', () => {
  const broad = validate([slice('a', ['**/*.md']), slice('b', ['*/**']), slice('c', ['**'])]);
  assert.deepEqual(codes(broad), ['write-path-forbidden', 'write-path-forbidden', 'write-path-forbidden']);
  assert.match(broad.refusals[0].detail, /reaches/);
  assert.equal(validate([slice('d', ['docs/**/*.md'], { capability: 'docs:write' })]).ok, true);
  assert.ok(!codes(validate([slice('s', ['src/a/*.mjs'])])).includes('write-path-forbidden'));
});

test('the run-state store is forbidden to a slice that dispatches, and a slice that asks the owner first may name it', () => {
  const files = { ...repo, '.fgos/config.yaml': 'x: 1\n' };
  const dispatching = validateProposal({ slices: [slice('a', ['.fgos/config.yaml'])], runnerConfig, ports: memoryPorts(files) });
  assert.deepEqual(codes(dispatching), ['write-path-forbidden']);
  const asking = validateProposal({ slices: [slice('a', ['.fgos/config.yaml'], { capability: null, pattern: null, askOwnerFirst: true, rigor: 'critical' })], runnerConfig, ports: memoryPorts(files) });
  assert.equal(asking.ok, true);
});

test('a path that goes through a symbolic link, or whose directory does, is refused', () => {
  const ports = memoryPorts({ ...repo, 'alias/guide.md': '# same as docs\n' }, { links: ['alias'] });
  const result = validateProposal({ slices: [slice('a', ['alias/guide.md'], { capability: 'docs:write' }), slice('b', ['alias/new.md'], { capability: 'docs:write' })], runnerConfig, ports });
  assert.deepEqual(codes(result), ['write-path-forbidden', 'write-path-forbidden']);
  assert.match(result.refusals[0].detail, /symbolic link/);
});

test('a new file is legitimate only where its directory exists; anything else is refused as missing', () => {
  assert.equal(validate([slice('ok', ['src/a/brand-new.mjs'])]).ok, true);
  assert.equal(validate([slice('ok', ['top-level-new.md'])]).ok, true);
  const missing = validate([slice('a', ['src/nowhere/new.mjs']), slice('b', ['src/missing-dir/'])]);
  assert.deepEqual(codes(missing), ['write-path-missing', 'write-path-missing']);
});

test('a glob or directory that names no file is refused as empty', () => {
  const result = validate([slice('a', ['src/a/**/*.rs'])]);
  assert.deepEqual(codes(result), ['write-scope-empty']);
});

test('a capability, or a follow-up capability, that nothing registers is refused; an alias counts', () => {
  assert.deepEqual(codes(validate([slice('a', ['src/a/one.mjs'], { capability: 'code:imagine' })])), ['capability-unregistered']);
  assert.deepEqual(codes(validate([slice('d', ['docs/guide.md'], { capability: 'docs:write', followUp: { capability: 'audit', pattern: 'solo' } })])), ['capability-unregistered']);
  assert.equal(validate([slice('d', ['docs/guide.md'], { capability: 'docs:write', followUp: { capability: 'peer-review', pattern: 'solo' } })]).ok, true);
});

test('a slice that asks the owner first names no capability and is listed, not refused for it', () => {
  const result = validate([slice('data', ['src/a/two.mjs'], { capability: null, pattern: null, askOwnerFirst: true, rigor: 'critical' })]);
  assert.equal(result.ok, true);
  assert.deepEqual(result.ownerFirst, ['data']);
});

test('a slice below the frame floor is refused, and one at or above it is not', () => {
  const low = slice('doc', ['docs/guide.md'], { rigor: 'low', capability: 'docs:write', pattern: 'solo' });
  assert.deepEqual(codes(validate([low], { rigorFloor: 'standard' })), ['rigor-below-floor']);
  assert.equal(validate([low], { rigorFloor: 'low' }).ok, true);
  assert.equal(validate([slice('a', ['src/a/two.mjs'], { rigor: 'high' })], { rigorFloor: 'standard' }).ok, true);
});

test('two slices writing the same file, or one a directory over the other\'s file, are refused as overlapping', () => {
  assert.deepEqual(codes(validate([slice('a', ['src/a/two.mjs']), slice('b', ['src/a/two.mjs'])])), ['write-overlap']);
  const inside = validate([slice('a', ['src/a']), slice('b', ['src/a/two.mjs'])]);
  assert.deepEqual(codes(inside), ['write-overlap']);
  assert.deepEqual(inside.refusals[0].paths, ['src/a', 'src/a/two.mjs']);
  assert.deepEqual(codes(validate([slice('a', ['src/**/*.mjs']), slice('b', ['src/b/three.mjs'])])), ['write-overlap']);
  assert.deepEqual(codes(validate([slice('a', ['src/a/new-file.mjs']), slice('b', ['src/a'])])), ['write-overlap']);
});

test('two modules with the same last two path segments are not confused: a test of one is not a test of the other', () => {
  const files = { 'src/a/hub.mjs': '', 'src/b/a/hub.mjs': '', 'test/b.test.mjs': "import '../src/b/a/hub.mjs';\n" };
  const result = validateProposal({ slices: [slice('x', ['src/a/hub.mjs']), slice('y', ['src/b/a/hub.mjs'])], runnerConfig, ports: memoryPorts(files) });
  assert.equal(result.ok, true);
  assert.deepEqual(result.expansions.map((e) => [e.slice, e.add]), [['y', ['test/b.test.mjs']]]);
});

test('slices over different files and directories do not overlap', () => {
  assert.equal(validate([slice('a', ['src/a/two.mjs']), slice('b', ['src/b/three.mjs']), slice('c', ['docs/guide.md'], { capability: 'docs:write' })]).ok, true);
  assert.equal(validate([slice('a', ['src/a/two.*']), slice('b', ['src/b/*.mjs'])]).ok, true);
});

test('a test the slice\'s own writes already cover is not added, and one another slice writes is named, not added', () => {
  const own = validate([slice('a', ['src/a/one.mjs', 'test/a/one.test.mjs'])]);
  assert.deepEqual(own.expansions[0].add, ['test/a/shared.test.mjs']);
  const elsewhere = validate([slice('a', ['src/a/one.mjs']), slice('t', ['test/a'], { capability: 'code:test' })]);
  assert.equal(elsewhere.ok, true);
  assert.deepEqual(elsewhere.expansions[0].add, []);
  assert.deepEqual(elsewhere.expansions[0].coveredElsewhere, [{ path: 'test/a/one.test.mjs', slice: 't' }, { path: 'test/a/shared.test.mjs', slice: 't' }]);
});

test('a test that exercises the code of two slices cannot be added to both: the overlap is refused and says it came from the addition', () => {
  const result = validate([slice('a', ['src/a/one.mjs']), slice('b', ['src/b/three.mjs'])]);
  const overlap = result.refusals.filter((r) => r.code === 'write-overlap');
  assert.equal(overlap.length, 1);
  assert.deepEqual(overlap[0].paths, ['test/a/shared.test.mjs', 'test/a/shared.test.mjs']);
  assert.equal(overlap[0].viaExpansion, true);
});

test('tests are searched only for code a slice changes: a document slice and a test slice add nothing', () => {
  const result = validate([slice('d', ['docs/guide.md'], { capability: 'docs:write' }), slice('t', ['test/b/three.test.mjs'], { capability: 'code:test' })]);
  assert.deepEqual(result.expansions, []);
});

test('a Rust file is searched by its crate directory and package name, not by a bare directory word', () => {
  const rust = {
    ...repo,
    'packages/git/rust/Cargo.toml': '[package]\nname = "fgos-git"\n',
    'packages/git/rust/src/lib.rs': '',
    'test/uses-crate.test.mjs': "spawn('fgos_git')\n",
    'test/uses-dir.test.mjs': "see packages/git/rust\n",
    'test/mentions-git.test.mjs': 'a git worktree, git status and git log\n',
    'packages/orphan/src/lib.rs': '',
  };
  const result = validateProposal({ slices: [slice('r', ['packages/git/rust/src/lib.rs'], { rigor: 'high' })], runnerConfig, ports: memoryPorts(rust) });
  assert.deepEqual(result.expansions[0].terms, ['fgos-git', 'fgos_git', 'packages/git/rust']);
  assert.deepEqual(result.expansions[0].add, ['test/uses-crate.test.mjs', 'test/uses-dir.test.mjs']);
  const orphan = validateProposal({ slices: [slice('o', ['packages/orphan/src/lib.rs'], { rigor: 'high' })], runnerConfig, ports: memoryPorts(rust) });
  assert.deepEqual(orphan.expansions, []);
});

test('a slice whose code is too broad to size the tests of is refused as too wide, by terms and by tests', () => {
  const wide = {};
  for (let i = 0; i < TEST_SCAN_LIMITS.terms + 1; i += 1) wide[`src/w/file-${i}.mjs`] = '';
  const byTerms = validateProposal({ slices: [slice('w', ['src/w'])], runnerConfig, ports: memoryPorts(wide) });
  assert.deepEqual(codes(byTerms), ['test-scan-too-wide']);
  assert.equal(byTerms.refusals[0].terms, TEST_SCAN_LIMITS.terms + 1);

  const busy = { 'src/hub.mjs': '' };
  for (let i = 0; i < TEST_SCAN_LIMITS.tests + 1; i += 1) busy[`test/uses-${i}.test.mjs`] = 'src/hub.mjs';
  const byTests = validateProposal({ slices: [slice('h', ['src/hub.mjs'])], runnerConfig, ports: memoryPorts(busy) });
  assert.deepEqual(codes(byTests), ['test-scan-too-wide']);
  assert.equal(byTests.refusals[0].tests, TEST_SCAN_LIMITS.tests + 1);

  const owned = validateProposal({ slices: [slice('h', ['src/hub.mjs']), slice('t', ['test'], { capability: 'code:test' })], runnerConfig, ports: memoryPorts(busy) });
  assert.deepEqual(codes(owned), ['test-scan-too-wide'], 'handing the tests to another slice does not make the scan narrower');
});

test('every problem of a proposal is reported together, not only the first', () => {
  const result = validate([
    slice('a', ['node_modules/x.js'], { capability: 'code:imagine' }),
    slice('b', ['src/a/two.mjs'], { rigor: 'low' }),
    slice('c', ['src/a/two.mjs']),
  ], { rigorFloor: 'standard' });
  assert.deepEqual([...new Set(codes(result))].sort(), ['capability-unregistered', 'rigor-below-floor', 'write-overlap', 'write-path-forbidden']);
});

// ---- over a checkout on disk -----------------------------------------------------------------------

test('on disk: links are not followed, tests are found next to the code and by relative import, crates by manifest', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'propose-validate-'));
  try {
    const put = (rel, text = '') => {
      fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
      fs.writeFileSync(path.join(root, rel), text);
    };
    put('src/a/hub.mjs');
    put('src/a/hub.test.mjs', "import { x } from './hub.mjs';\n");
    put('test/deep/uses.test.mjs', "const hub = await import('../../src/a/hub.mjs');\n");
    put('test/other.test.mjs', "import '../src/b/a/hub.mjs';\n");
    put('app/client.ts');
    put('app/client.test.ts', "import './client.ts';\n");
    put('crates/core/Cargo.toml', '[package]\nname = "fgos-core"\n');
    put('crates/core/src/lib.rs');
    put('outside/note.md', 'outside\n');
    put('node_modules/pkg/index.js');
    fs.symlinkSync(path.join(root, 'outside'), path.join(root, 'src/escape'));
    const ports = createRepoPorts({ root });

    assert.equal(ports.stat('src/escape'), 'link');
    assert.equal(ports.stat('src/escape/note.md'), 'link');
    assert.deepEqual(ports.listFiles('src/escape'), []);
    assert.equal(ports.stat('src/a/hub.mjs'), 'file');
    assert.equal(ports.stat('src/a/missing.mjs'), null);
    assert.ok(!ports.listFiles('.').some((file) => file.startsWith('node_modules/')));

    assert.deepEqual(ports.findTests(['src/a/hub.mjs']), ['src/a/hub.test.mjs', 'test/deep/uses.test.mjs']);
    assert.deepEqual(ports.findTests(['app/client.ts']), ['app/client.test.ts']);
    assert.deepEqual(ports.crateOf('crates/core/src/lib.rs'), { dir: 'crates/core', name: 'fgos-core' });
    assert.equal(ports.crateOf('outside/note.md'), null);

    const escaped = validateProposal({ slices: [slice('e', ['src/escape/new.md'], { capability: 'docs:write' })], runnerConfig, ports });
    assert.deepEqual(codes(escaped), ['write-path-forbidden']);
    const colocated = validateProposal({ slices: [slice('c', ['src/a/hub.mjs'])], runnerConfig, ports });
    assert.deepEqual(colocated.expansions[0].add, ['src/a/hub.test.mjs', 'test/deep/uses.test.mjs']);
    const typed = validateProposal({ slices: [slice('t', ['app/client.ts'])], runnerConfig, ports });
    assert.deepEqual(typed.expansions[0].add, ['app/client.test.ts']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ---- over this repository --------------------------------------------------------------------------

test('over the real repository: classified, validated and sized with the same slices', () => {
  const root = path.resolve(import.meta.dirname, '../..');
  const ports = createRepoPorts({ root });
  const config = readStandardValue('runner').value;

  assert.equal(ports.stat('src/workflow/propose-frame.mjs'), 'file');
  assert.equal(ports.stat('src/workflow'), 'dir');
  assert.equal(ports.stat('src/workflow/does-not-exist.mjs'), null);
  assert.ok(ports.listFiles('src/workflow/propose-*.mjs').includes('src/workflow/propose-validate.mjs'));
  assert.ok(ports.findTests(['src/workflow/propose-frame.mjs']).includes('test/workflow/propose-frame.test.mjs'));
  assert.equal(ports.crateOf('packages/git/rust/src/lib.rs')?.name, 'fgos-git');

  const writes = ['src/workflow/propose-frame.mjs'];
  const classified = classifySlice({ writes, listFiles: ports.listFiles });
  const mine = { id: 'frame', writes, ...classified };
  const docs = { id: 'notes', writes: ['docs/brand-new-note.md'], ...classifySlice({ writes: ['docs/brand-new-note.md'], listFiles: ports.listFiles }) };
  const result = validateProposal({ slices: [mine, docs], runnerConfig: config, rigorFloor: 'low', ports });
  assert.deepEqual(result.refusals, []);
  assert.ok(result.expansions.find((e) => e.slice === 'frame').add.includes('test/workflow/propose-frame.test.mjs'));

  const refused = validateProposal({ slices: [{ id: 'lost', writes: ['src/no-such-dir/x.mjs'], ...classifySlice({ writes: ['src/no-such-dir/x.mjs'], listFiles: ports.listFiles }) }], runnerConfig: config, ports });
  assert.deepEqual(codes(refused), ['write-path-missing']);

  const sized = proposeFrame({
    slices: [{ ...mine, kind: classified.kind }, { ...docs, kind: 'docs' }],
    catalog: { runnerConfig: {}, shipped: shippedCatalog() },
    frameDefaults: { fallbackPerSeat: 2, deviationsBeforeAsk: 2 },
  });
  assert.equal(sized.breakdown.reads.followUps, 1);
});
