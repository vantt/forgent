// test/runner/write-scope-globs.test.mjs — the one glob engine behind scope matching and the proposal's overlap check

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { globsMeet, matchesWriteScope } from '../../src/runner/dispatch/write-scope.mjs';

const segments = (glob) => glob.split('/');

// why not in write-scope.test.mjs: that file also runs against the native leaf, which has no pattern-against-pattern call.
test('a glob meets a concrete path exactly when the scope matches it, whatever punctuation the names carry', () => {
  const cases = [
    ['a?*', 'a.txt', false], ['a?*', 'a?.txt', true], ['a$*', 'a$b', true], ['{x}*', '{x}y', true], ['{x}*', 'xy', false],
    ['(a|b)*', '(a|b)c', true], ['(a|b)*', 'ac', false], ['a+*', 'a+b', true], ['a+*', 'aab', false], ['^a*', '^ab', true],
    ['[ab]*', '[ab]c', true], ['[ab]*', 'ac', false], ['a.*', 'a.b', true], ['a.*', 'axb', false], ['tài*', 'tài-liệu', true],
    ['*.mjs', 'a.mjs', true], ['*.mjs', 'a.mjs.bak', false], ['src/**/x.mjs', 'src/a/b/x.mjs', true], ['src/**/x.mjs', 'src/x.mjs', true],
  ];
  for (const [pattern, file, expected] of cases) {
    assert.equal(matchesWriteScope(file, [pattern]), expected, `scope ${pattern} on ${file}`);
    assert.equal(globsMeet(segments(pattern), segments(file)), expected, `globsMeet ${pattern} with ${file}`);
  }
});

test('two globs meet when some path can match both, and wildcard segments are judged by their fixed ends', () => {
  const meet = (a, b) => [globsMeet(segments(a), segments(b)), globsMeet(segments(b), segments(a))];
  assert.deepEqual(meet('**/*.md', 'docs/**'), [true, true]);
  assert.deepEqual(meet('a/*/c', 'a/b/*'), [true, true]);
  assert.deepEqual(meet('*/**', '.git/**'), [true, true]);
  assert.deepEqual(meet('a/x*', 'a/y*'), [false, false]);
  assert.deepEqual(meet('src/*.mjs', 'test/**'), [false, false]);
  assert.deepEqual(meet('a/b', 'a/b'), [true, true]);
});
