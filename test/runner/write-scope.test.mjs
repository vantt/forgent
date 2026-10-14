import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  WriteScopeError,
  canonicalizeWriteEntry,
  canonicalizeWrites,
  expandGenerated,
  matchesWriteScope,
  partitionPaths,
} from '../../src/runner/dispatch/write-scope.mjs';

test('canonicalizeWriteEntry: spellings of one directory collapse to one entry', () => {
  for (const raw of ['./docs', 'docs/', 'docs//', 'docs', ' docs ', '././docs', './/docs', 'docs/.', 'docs/./']) {
    assert.equal(canonicalizeWriteEntry(raw), 'docs', `raw=${JSON.stringify(raw)}`);
  }
  assert.equal(canonicalizeWriteEntry('a//b/./c/'), 'a/b/c');
});

test('canonicalizeWriteEntry: refuses entries git or the matcher would read differently', () => {
  for (const raw of ['.', './', '', '   ', '/x', '//x', 'a/../b', '..', 'a\\b', 'a\0b', ':(top)x', ':!x', './:x', 'a**', '**.md', 'a/***/b', 42, null]) {
    assert.throws(() => canonicalizeWriteEntry(raw), WriteScopeError, `raw=${JSON.stringify(raw)}`);
  }
});

test('canonicalizeWriteEntry: only * and ** are glob; other punctuation stays literal', () => {
  for (const raw of ['app/[slug]/page.tsx', 'app/(group)/[id]/route.ts', 'a?b', '{a,b}', '!x', '**', 'a/**/b', 'docs/*.md']) {
    assert.equal(canonicalizeWriteEntry(raw), raw);
  }
});

test('matchesWriteScope: literal-punctuation entries match only that exact path', () => {
  assert.equal(matchesWriteScope('app/[slug]/page.tsx', ['app/[slug]/page.tsx']), true);
  assert.equal(matchesWriteScope('app/s/page.tsx', ['app/[slug]/page.tsx']), false);
  assert.equal(matchesWriteScope('app/(group)/[id]/route.ts', ['app/(group)/[id]/route.ts']), true);
  assert.equal(matchesWriteScope('app/group/1/route.ts', ['app/(group)/[id]/route.ts']), false);
  assert.equal(matchesWriteScope('a?b', ['a?b']), true);
  assert.equal(matchesWriteScope('axb', ['a?b']), false);
  assert.equal(matchesWriteScope('{a,b}', ['{a,b}']), true);
  assert.equal(matchesWriteScope('a', ['{a,b}']), false);
  assert.equal(matchesWriteScope('!x', ['!x']), true);
  assert.equal(matchesWriteScope('y', ['!x']), false);
});

test('matchesWriteScope: a plain entry covers the path itself and everything beneath it', () => {
  assert.equal(matchesWriteScope('docs/a.md', ['docs']), true);
  assert.equal(matchesWriteScope('docs', ['docs']), true);
  assert.equal(matchesWriteScope('docs/x/y/z.md', ['docs']), true);
  assert.equal(matchesWriteScope('docs-old/a.md', ['docs']), false);
});

test('matchesWriteScope: * stays inside one segment, ** spans zero or more', () => {
  assert.equal(matchesWriteScope('plans/x/reports/a/b.md', ['plans/*/reports/**']), true);
  assert.equal(matchesWriteScope('plans/x/reports/a.md', ['plans/*/reports/**']), true);
  assert.equal(matchesWriteScope('plans/x/y/reports/a.md', ['plans/*/reports/**']), false);
  assert.equal(matchesWriteScope('a.md', ['*.md']), true);
  assert.equal(matchesWriteScope('d/a.md', ['*.md']), false);
  assert.equal(matchesWriteScope('a/b', ['a/**/b']), true);
  assert.equal(matchesWriteScope('a/x/y/b', ['a/**/b']), true);
  assert.equal(matchesWriteScope('src/deep/file.mjs', ['**']), true);
});

test('matchesWriteScope: the .fgos store never matches, not even under **', () => {
  for (const scope of [['**'], ['.fgos'], ['.fgos/**'], ['*/**']]) {
    assert.equal(matchesWriteScope('.fgos/state.json', scope), false, `scope=${scope}`);
    assert.equal(matchesWriteScope('.fgos', scope), false, `scope=${scope}`);
  }
});

test('matchesWriteScope: names with spaces and unicode match like any other', () => {
  assert.equal(matchesWriteScope('docs/tài liệu/ghi chú.md', ['docs/tài liệu']), true);
  assert.equal(matchesWriteScope('docs/tài liệu/ghi chú.md', ['docs/*/ghi chú.md']), true);
  assert.equal(matchesWriteScope('docs/tai lieu/ghi chú.md', ['docs/tài liệu']), false);
});

test('canonicalizeWrites: canonicalizes, de-duplicates and keeps first-seen order', () => {
  assert.deepEqual(canonicalizeWrites(['./src', 'docs/', 'src', 'docs//', 'b']), ['src', 'docs', 'b']);
  assert.deepEqual(canonicalizeWrites([]), []);
  assert.throws(() => canonicalizeWrites(['ok', '.']), WriteScopeError);
  assert.throws(() => canonicalizeWrites('docs'), WriteScopeError);
});

const GENERATED = [{ from: 'core/skills/**', also: ['.agents/skills/**', 'plugins/fgOS/skills/**', '.claude/skills/**'] }];

test('expandGenerated: a write inside a generated source pulls in its render targets', () => {
  assert.deepEqual(expandGenerated(['core/skills/x/SKILL.md'], GENERATED), [
    'core/skills/x/SKILL.md', '.agents/skills/**', 'plugins/fgOS/skills/**', '.claude/skills/**',
  ]);
  // Containment either way: a write that encloses the source also pulls them in.
  assert.deepEqual(expandGenerated(['core'], GENERATED), ['core', '.agents/skills/**', 'plugins/fgOS/skills/**', '.claude/skills/**']);
});

test('expandGenerated: unrelated writes and sibling prefixes add nothing', () => {
  assert.deepEqual(expandGenerated(['docs/'], GENERATED), ['docs']);
  assert.deepEqual(expandGenerated(['core/skills-old/a.md'], GENERATED), ['core/skills-old/a.md']);
  assert.deepEqual(expandGenerated([], GENERATED), []);
  assert.deepEqual(expandGenerated(['docs'], []), ['docs']);
});

test('partitionPaths: splits changed paths by scope, .fgos always out', () => {
  assert.deepEqual(
    partitionPaths(['docs/a.md', 'src/b.mjs', '.fgos/state.json', 'docs-old/c.md'], ['docs', 'src/**']),
    { inScope: ['docs/a.md', 'src/b.mjs'], outOfScope: ['.fgos/state.json', 'docs-old/c.md'] },
  );
});

test('matchesWriteScope: a queried path that escapes or is absolute never matches', () => {
  assert.equal(matchesWriteScope('docs/../.fgos/state.json', ['docs']), false);
  assert.equal(matchesWriteScope('docs/../src/a.mjs', ['**']), false);
  assert.equal(matchesWriteScope('/docs/a.md', ['docs']), false);
  assert.equal(matchesWriteScope('docs\\a.md', ['docs']), false);
  assert.equal(matchesWriteScope('docs/a\0.md', ['docs']), false);
  assert.equal(matchesWriteScope('docs/./a.md', ['docs']), true);
});

test('matchesWriteScope: scope entries are read canonically, so docs/ and ./docs still cover docs', () => {
  assert.equal(matchesWriteScope('docs/a.md', ['docs/']), true);
  assert.equal(matchesWriteScope('docs/a.md', ['./docs']), true);
  assert.throws(() => matchesWriteScope('docs/a.md', ['../docs']), WriteScopeError);
});

test('canonicalizeWriteEntry: canonical form is a fixed point', () => {
  for (const raw of ['docs /', ' ./a/ b ', 'docs/', 'a/**/**/b', 'tài liệu/']) {
    const once = canonicalizeWriteEntry(raw);
    assert.equal(canonicalizeWriteEntry(once), once, `raw=${JSON.stringify(raw)}`);
  }
  assert.equal(canonicalizeWriteEntry('docs /'), 'docs');
});

test('repeated ** collapse to one, and matching stays fast on deep paths', () => {
  assert.equal(canonicalizeWriteEntry('a/**/**/**/b'), 'a/**/b');
  const deep = Array.from({ length: 60 }, (_, i) => `s${i}`).join('/');
  const started = Date.now();
  assert.equal(matchesWriteScope(`${deep}/x`, ['**/*/**/*/**/*/**/*/**/y']), false);
  assert.equal(matchesWriteScope(`${deep}/y`, ['**/*/**/*/**/*/**/*/**/y']), true);
  assert.ok(Date.now() - started < 500, `took ${Date.now() - started}ms`);
});
