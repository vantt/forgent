// test/report/authoritative-match.test.mjs — tsk-1lv-6 (D8/D12): skeleton
// match over docs' own `authoritative_for` frontmatter, so a growing skill
// finds the doc already authoritative for a topic instead of guessing a
// second path. Pure module, no CLI wiring — unit tests only.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SKELETON_ADAPTERS, findAuthoritativeMatch, findDuplicateAuthoritativeClaims } from '../../src/report/authoritative-match.mjs';

test('findAuthoritativeMatch: exact topic match returns the candidate', () => {
  const candidates = [
    { path: 'docs/how-to/pick.md', authoritativeFor: 'claiming a work item' },
    { path: 'docs/how-to/approve.md', authoritativeFor: 'landing a work item' },
  ];
  assert.equal(
    findAuthoritativeMatch('claiming a work item', candidates),
    candidates[0],
  );
});

test('findAuthoritativeMatch: case/diacritic/punctuation-insensitive skeleton match', () => {
  const candidates = [{ path: 'docs/how-to/quy-trinh.md', authoritativeFor: 'Quy trình pick, để sau' }];
  assert.equal(
    findAuthoritativeMatch('quy trinh PICK để SAU!!', candidates),
    candidates[0],
  );
});

test('findAuthoritativeMatch: Vietnamese "đ" folds the same as its ASCII "d" counterpart', () => {
  const candidates = [{ path: 'docs/explanation/doi-chieu.md', authoritativeFor: 'đối chiếu quyết định' }];
  assert.equal(
    findAuthoritativeMatch('doi chieu quyet dinh', candidates),
    candidates[0],
  );
});

test('findAuthoritativeMatch: no match returns null', () => {
  const candidates = [{ path: 'docs/how-to/pick.md', authoritativeFor: 'claiming a work item' }];
  assert.equal(findAuthoritativeMatch('an unrelated topic', candidates), null);
});

test('findAuthoritativeMatch: empty candidates returns null', () => {
  assert.equal(findAuthoritativeMatch('anything', []), null);
});

test('findAuthoritativeMatch: candidates missing/blank authoritativeFor never match', () => {
  const candidates = [
    { path: 'docs/how-to/no-field.md' },
    { path: 'docs/how-to/blank.md', authoritativeFor: '   ' },
    { path: 'docs/how-to/real.md', authoritativeFor: 'the real topic' },
  ];
  assert.equal(
    findAuthoritativeMatch('the real topic', candidates),
    candidates[2],
  );
});

test('findAuthoritativeMatch: empty topic never matches even against a candidate with a real authoritativeFor', () => {
  const candidates = [{ path: 'docs/how-to/real.md', authoritativeFor: 'the real topic' }];
  assert.equal(findAuthoritativeMatch('', candidates), null);
  assert.equal(findAuthoritativeMatch('   ', candidates), null);
});

test('findAuthoritativeMatch: returns the first match in candidate order when more than one would match', () => {
  const candidates = [
    { path: 'docs/how-to/first.md', authoritativeFor: 'shared topic' },
    { path: 'docs/how-to/second.md', authoritativeFor: 'shared topic' },
  ];
  assert.equal(
    findAuthoritativeMatch('shared topic', candidates),
    candidates[0],
  );
});

test('findAuthoritativeMatch: unknown adapter name throws, listing the known adapters', () => {
  const candidates = [{ path: 'docs/how-to/real.md', authoritativeFor: 'topic' }];
  assert.throws(
    () => findAuthoritativeMatch('topic', candidates, { adapter: 'semantic-v1' }),
    /unknown adapter "semantic-v1"/,
  );
});

test('SKELETON_ADAPTERS: exposes the default "skeleton-v1" adapter by name (port/adapter registry, D12)', () => {
  assert.ok(SKELETON_ADAPTERS['skeleton-v1']);
  assert.equal(typeof SKELETON_ADAPTERS['skeleton-v1'].matches, 'function');
});

// --- findDuplicateAuthoritativeClaims (harness backstop, D8) ---

test('findDuplicateAuthoritativeClaims: flags two docs claiming the same subject, even paraphrased by case/diacritics/punctuation', () => {
  const candidates = [
    { path: 'docs/how-to/a.md', authoritativeFor: 'claiming a work item' },
    { path: 'docs/how-to/b.md', authoritativeFor: 'Claiming A Work Item!' },
    { path: 'docs/how-to/c.md', authoritativeFor: 'landing a work item' },
  ];
  const duplicates = findDuplicateAuthoritativeClaims(candidates);
  assert.equal(duplicates.length, 1);
  assert.deepEqual(duplicates[0], [candidates[0], candidates[1]]);
});

test('findDuplicateAuthoritativeClaims: returns [] when every claimed subject has exactly one owner', () => {
  const candidates = [
    { path: 'docs/how-to/a.md', authoritativeFor: 'topic one' },
    { path: 'docs/how-to/b.md', authoritativeFor: 'topic two' },
  ];
  assert.deepEqual(findDuplicateAuthoritativeClaims(candidates), []);
});

test('findDuplicateAuthoritativeClaims: ignores candidates with no/blank authoritativeFor', () => {
  const candidates = [
    { path: 'docs/how-to/a.md' },
    { path: 'docs/how-to/b.md', authoritativeFor: '  ' },
  ];
  assert.deepEqual(findDuplicateAuthoritativeClaims(candidates), []);
});

test('findDuplicateAuthoritativeClaims: empty input returns []', () => {
  assert.deepEqual(findDuplicateAuthoritativeClaims([]), []);
});

test('findDuplicateAuthoritativeClaims: unknown adapter name throws', () => {
  assert.throws(
    () => findDuplicateAuthoritativeClaims([{ path: 'a.md', authoritativeFor: 'x' }], { adapter: 'semantic-v1' }),
    /unknown adapter "semantic-v1"/,
  );
});
