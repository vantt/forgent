// test/workflow/propose-classify.test.mjs — the slice table: what write paths make of a slice's kind and rigor

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { classifySlice, loadSliceTable } from '../../src/workflow/propose-classify.mjs';
import { RIGOR_ORDER } from '../../src/workflow/case-projection.mjs';
import { readStandardValue } from '../../src/config/facade.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';

const classify = (writes, raise) => classifySlice({ writes, raise });
const rank = (rigor) => RIGOR_ORDER.indexOf(rigor);

test('a slice that writes only docs or plans is documentation, written solo with a review after, at low rigor', () => {
  for (const writes of [['docs/specs/runner.md'], ['plans/261101-2138-cook-front-door-propose/plan.md', 'CHANGELOG.md']]) {
    const slice = classify(writes);
    assert.deepEqual([slice.kind, slice.capability, slice.pattern, slice.rigor], ['docs', 'docs:write', 'solo', 'low']);
    assert.deepEqual(slice.followUp, { capability: 'review', pattern: 'solo' });
  }
});

test('a slice that writes only tests is a test slice, reviewed at standard rigor', () => {
  const slice = classify(['test/workflow/case-gate.test.mjs']);
  assert.deepEqual([slice.kind, slice.capability, slice.pattern, slice.rigor], ['test', 'code:test', 'reviewed', 'standard']);
});

test('ordinary source is code, reviewed at standard rigor, and code outranks tests and docs in a mixed slice', () => {
  const slice = classify(['src/workflow/case-gate.mjs', 'test/workflow/case-verbs.test.mjs', 'docs/specs/workflow.md']);
  assert.deepEqual([slice.kind, slice.capability, slice.pattern, slice.rigor], ['code', 'code:implement', 'reviewed', 'standard']);
});

test('a slice that touches a locked contract, a schema or a locked law is high, whatever else it writes', () => {
  for (const file of ['packages/git/contracts/receipt.v1.schema.json', 'core/config-schema/runner.schema.yaml', 'docs/platform-foundations.md', 'docs/specs/platform-foundations.md', 'domains/coding/slice-kinds.yaml']) {
    for (const writes of [[file], ['docs/notes.md', file], ['test/a.test.mjs', 'src/a.mjs', file]]) {
      const slice = classify(writes);
      assert.equal(slice.kind, 'contract', `${writes.join(', ')}`);
      assert.equal(slice.rigor, 'high');
      assert.equal(slice.pattern, 'reviewed');
    }
  }
});

test('a slice that touches a Rust crate, a lock file, identity, locks or the git write door is high', () => {
  for (const file of ['packages/git/rust/src/lib.rs', 'packages/git/write-scope/src/lib.rs', 'packages/identity/rust/Cargo.toml', 'Cargo.lock', 'package-lock.json', 'apps/fgos-gateway/src/mcp.rs', 'src/identity/directory-store.mjs', 'src/holder-lock/index.mjs', 'src/git/scoped-commit.mjs', 'src/workflow/case-lock.mjs', 'src/native/door.mjs', 'src/util/session-identity.mjs', 'src/util/identity-mint.mjs', 'src/state/hot-lock.mjs', 'src/runner/repo-locks.mjs', 'src/setup/holder-lock-checks.mjs', 'tools/platform-probe/src/git.rs', 'tools/terminal-gate-probe/Cargo.toml', 'herdr-dashboard/Cargo.lock', 'packages/yaml-doc/third-party/saphyr-parser-0.2.2/Cargo.toml']) {
    const slice = classify(['docs/notes.md', file]);
    assert.equal(slice.kind, 'platform', file);
    assert.equal(slice.rigor, 'high', file);
  }
});

test('data and migration paths need the owner first: critical rigor, no capability, no dispatch', () => {
  for (const file of ['db/migrations/001-add-table.sql', 'src/store/migrations/2026.mjs', '.fgos/state/work.json']) {
    const slice = classify(['src/a.mjs', file]);
    assert.equal(slice.kind, 'irreversible', file);
    assert.equal(slice.rigor, 'critical');
    assert.equal(slice.askOwnerFirst, true);
    assert.equal(slice.dispatch, false);
    assert.equal(slice.capability, null);
    assert.equal(slice.pattern, null);
  }
});

test('a path no rule names is treated as ordinary code and says so', () => {
  const slice = classify(['weird/thing.bin']);
  assert.deepEqual([slice.kind, slice.rigor], ['code', 'standard']);
  assert.deepEqual(slice.paths, [{ path: 'weird/thing.bin', ruleId: 'code', byDefault: true }]);
});

test('a directory or a glob is judged by what it covers, and one it cannot see is reported instead of guessed', () => {
  assert.equal(classify(['src/git/']).rigor, 'high');
  assert.equal(classify(['src/git']).kind, 'platform');
  assert.equal(classify(['packages/git']).rigor, 'high');
  assert.equal(classify(['packages/*/contracts/**']).kind, 'contract');
  assert.equal(classify(['src/workflow/propose-*.mjs']).rigor, 'standard');
  assert.equal(classify(['src/workflow/case-lock.mjs']).rigor, 'high');
  assert.equal(classify(['docs/how-to/**']).rigor, 'low');
  assert.equal(classify(['docs/**']).rigor, 'high', 'docs/** also names the locked law');
  for (const glob of ['packages/**', 'core/**', 'apps/**', 'packages/git/**', 'tools/**', 'herdr-dashboard/**', 'packages/**/Cargo.lock']) {
    assert.equal(classify([glob]).rigor, 'high', glob);
  }
  assert.ok(rank(classify(['**/*.rs']).rigor) >= rank('high'), 'every Rust file is at least high');
  const everything = classify(['**/*.json']);
  assert.deepEqual([everything.kind, everything.askOwnerFirst], ['irreversible', true], 'a glob that can name .fgos files needs the owner first');
  assert.deepEqual(classify(['.']).kind, 'irreversible');
  assert.deepEqual(classify(['src/store/']).unresolvedScopes, ['src/store']);
  assert.deepEqual(classify(['src/workflow/propose-*.mjs']).unresolvedScopes, ['src/workflow/propose-*.mjs']);
  assert.deepEqual(classify(['src/workflow/propose-classify.mjs']).unresolvedScopes, []);
});

test('a directory dotted like a file is still a directory: the data directory needs the owner first', () => {
  for (const writes of [['.fgos'], ['.fgos/'], ['.fgos/state/work.json']]) {
    const slice = classify(writes);
    assert.deepEqual([slice.kind, slice.dispatch], ['irreversible', false], writes.join());
  }
});

test('a path written with doubled slashes or dot segments is judged as the path it names', () => {
  for (const [alias, kind] of [
    ['docs//platform-foundations.md', 'contract'],
    ['docs/./platform-foundations.md', 'contract'],
    ['packages/git//contracts/mutation-census.v1.json', 'contract'],
    ['./packages/./git/contracts/x.json', 'contract'],
    ['src/./git/scoped-commit.mjs', 'platform'],
    ['src//identity/directory-store.mjs', 'platform'],
  ]) assert.equal(classify([alias]).kind, kind, alias);
  assert.equal(classify(['./']).kind, 'irreversible', 'an empty path is the whole repository');
});

test('with the files under a directory in hand, a rule on file names reaches the parent directory', () => {
  const files = { 'src/store': ['src/store/index.mjs', 'src/store/migrations/2026.mjs'], db: ['db/schema.sql'], 'src/plain': ['src/plain/a.mjs'] };
  const listFiles = (scope) => files[scope] ?? [];
  assert.equal(classifySlice({ writes: ['src/store/'], listFiles }).kind, 'irreversible');
  assert.equal(classifySlice({ writes: ['db'], listFiles }).kind, 'irreversible');
  const plain = classifySlice({ writes: ['src/plain'], listFiles });
  assert.deepEqual([plain.kind, plain.unresolvedScopes], ['code', []]);
});

test('paths of equal rigor never decide the kind by the order they were written in', () => {
  for (const writes of [['test/a.test.mjs', 'src/a.mjs'], ['src/a.mjs', 'test/a.test.mjs']]) assert.equal(classify(writes).kind, 'code');
  for (const writes of [['packages/git/contracts/x.json', 'src/git/x.mjs'], ['src/git/x.mjs', 'packages/git/contracts/x.json']]) assert.equal(classify(writes).kind, 'contract');
});

test('an agent may raise a slice with a reason; the table is never lowered and a raise without a reason is refused', () => {
  const raised = classify(['src/workflow/case-gate.mjs'], { rigor: 'high', reason: 'changes how a gate settles' });
  assert.deepEqual([raised.rigor, raised.tableRigor], ['high', 'standard']);
  assert.deepEqual(raised.raised, { rigor: 'high', reason: 'changes how a gate settles' });

  const same = classify(['src/workflow/case-gate.mjs'], { rigor: 'standard', reason: 'no change' });
  assert.equal(same.raised, null);

  assert.throws(() => classify(['packages/git/contracts/receipt.v1.schema.json'], { rigor: 'standard', reason: 'small edit' }), { code: 'slice-rigor-below-table' });
  assert.throws(() => classify(['docs/a.md'], { rigor: 'high' }), { code: 'slice-raise-needs-reason' });
  assert.throws(() => classify(['docs/a.md'], { rigor: 'extreme', reason: 'x' }), { code: 'slice-raise-invalid' });
});

test('a slice without writes, or with a path outside the repository, is refused by name', () => {
  assert.throws(() => classify([]), { code: 'slice-writes-missing' });
  assert.throws(() => classify(['/etc/passwd']), { code: 'slice-write-invalid' });
  assert.throws(() => classify(['src/../../outside.mjs']), { code: 'slice-write-invalid' });
  assert.throws(() => classify(['']), { code: 'slice-write-invalid' });
});

test('every capability and pattern the table names exists in the shipped catalog, and no rule sits below its own kind floor', () => {
  const table = loadSliceTable();
  const runner = readStandardValue('runner').value;
  for (const rule of table.rules) {
    if (rule.askOwnerFirst) {
      assert.equal(rule.rigor, 'critical', rule.id);
      continue;
    }
    assert.ok(runner.capabilities[rule.capability], `${rule.id}: capability ${rule.capability}`);
    assert.ok(runner.patterns[rule.pattern], `${rule.id}: pattern ${rule.pattern}`);
    if (rule.followUp) {
      assert.ok(runner.capabilities[rule.followUp.capability], `${rule.id}: follow-up capability`);
      assert.ok(runner.patterns[rule.followUp.pattern], `${rule.id}: follow-up pattern`);
    }
  }
  assert.ok(rank(table.rules.find((r) => r.id === 'contract').rigor) >= rank('high'));
  assert.ok(rank(table.rules.find((r) => r.id === 'platform').rigor) >= rank('high'));
});

test('a malformed table is refused by name instead of classifying slices low', () => {
  const dir = makeFixtureDir('slice-table-');
  const write = (name, text) => {
    const file = path.join(dir, name);
    fs.writeFileSync(file, text);
    return file;
  };
  const rule = (extra = '') => `  - id: code\n    kind: code\n    capability: code:implement\n    pattern: reviewed\n    rigor: standard\n    match: ["src/**"]\n${extra}`;
  const request = 'request:\n  singleRunMaxPaths: 3\n  singleRunMaxRigor: standard\n';
  const good = `version: 1\ndefault:\n  kind: code\n${request}rules:\n${rule()}`;
  const protectedRules = (extra = '') => `  - id: contract\n    kind: contract\n    capability: code:implement\n    pattern: reviewed\n    rigor: high\n    match: ["a/**"]\n  - id: platform\n    kind: platform\n    capability: code:implement\n    pattern: reviewed\n    rigor: high\n    match: ["b/**"]\n  - id: irreversible\n    kind: irreversible\n    rigor: critical\n    askOwnerFirst: true\n    match: ["c/**"]\n${extra}`;
  const full = `version: 1\ndefault:\n  kind: code\n${request}rules:\n${rule()}${protectedRules()}`;
  assert.doesNotThrow(() => loadSliceTable({ tablePath: write('full.yaml', full) }));
  const cases = {
    'missing-protected.yaml': good,
    'version.yaml': full.replace('version: 1', 'version: 2'),
    'rigor.yaml': full.replace('rigor: standard', 'rigor: medium'),
    'match.yaml': full.replace('match: ["src/**"]', 'match: []'),
    'default.yaml': full.replace('default:\n  kind: code', 'default:\n  kind: nothing'),
    'twice.yaml': `${full}${rule()}`,
    'request-missing.yaml': full.replace(request, ''),
    'request-no-paths.yaml': full.replace('singleRunMaxPaths: 3', 'singleRunMaxPaths: 0'),
    'request-low-rigor.yaml': full.replace('singleRunMaxRigor: standard', 'singleRunMaxRigor: low'),
    'capability.yaml': full.replace('    capability: code:implement\n', ''),
    'code-low.yaml': full.replace('rigor: standard', 'rigor: low'),
    'contract-standard.yaml': full.replace('kind: contract\n    capability: code:implement\n    pattern: reviewed\n    rigor: high', 'kind: contract\n    capability: code:implement\n    pattern: reviewed\n    rigor: standard'),
    'irreversible-low.yaml': full.replace('rigor: critical', 'rigor: low'),
    'irreversible-dispatchable.yaml': full.replace('    askOwnerFirst: true\n', '    capability: code:implement\n    pattern: reviewed\n'),
    'default-docs.yaml': full.replace('default:\n  kind: code', 'default:\n  kind: docs').replace('rules:\n', 'rules:\n  - id: docs\n    kind: docs\n    capability: docs:write\n    pattern: solo\n    rigor: low\n    match: ["docs/**"]\n'),
  };
  for (const [name, text] of Object.entries(cases)) {
    assert.throws(() => loadSliceTable({ tablePath: write(name, text) }), { code: 'slice-table-invalid' }, name);
  }
});

test('every tracked Rust source, manifest, lock file and locked contract of this checkout classifies high or above', () => {
  const root = path.resolve(import.meta.dirname, '../..');
  const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\0').filter(Boolean);
  const outside = /^(archive|plans|docs|\.claude|\.agents|engineer|plugins|examples|dogfood-fixture)\//;
  const protectedFile = (file) => /(^|\/)(Cargo\.toml|Cargo\.lock|package-lock\.json)$/.test(file) || file.endsWith('.rs') || /^packages\/[^/]+\/contracts\//.test(file);
  const low = tracked.filter((file) => !outside.test(file) && protectedFile(file) && rank(classify([file]).rigor) < rank('high'));
  assert.deepEqual(low, []);
  const data = tracked.filter((file) => !outside.test(file) && (file.endsWith('.sql') || /(^|\/)migrations\//.test(file)) && !classify([file]).askOwnerFirst);
  assert.deepEqual(data, []);
});
