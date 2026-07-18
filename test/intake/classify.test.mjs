import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveTitle, classify, generateId } from '../../src/intake/classify.mjs';

// Mirrors work.mjs's (unexported) ID_PATTERN: kebab-case, letter-start.
const ID_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

test('deriveTitle cuts at the first sentence boundary', () => {
  assert.equal(deriveTitle('Login is broken. Users cannot sign in.'), 'Login is broken');
});

test('deriveTitle cuts at the first line boundary', () => {
  assert.equal(deriveTitle('Fix the header\nsecond line of detail'), 'Fix the header');
});

test('deriveTitle returns short text unchanged when no boundary exists', () => {
  assert.equal(deriveTitle('short text with no punctuation'), 'short text with no punctuation');
});

test('deriveTitle truncates long text with no natural boundary at a word edge', () => {
  const longText = 'word '.repeat(30).trim();
  const title = deriveTitle(longText);
  assert.ok(title.length <= 60);
  assert.equal(longText.startsWith(title), true);
});

test('deriveTitle falls back to a placeholder for blank or non-string input', () => {
  assert.equal(deriveTitle(''), 'Untitled submission');
  assert.equal(deriveTitle('   '), 'Untitled submission');
  assert.equal(deriveTitle(undefined), 'Untitled submission');
  assert.equal(deriveTitle(null), 'Untitled submission');
});

test('classify never throws, even for empty or non-string input', () => {
  for (const input of ['', '   ', undefined, null, 123, {}]) {
    assert.doesNotThrow(() => classify(input));
    const result = classify(input);
    assert.equal(typeof result.tier, 'string');
    assert.equal(typeof result.kind, 'string');
    assert.equal(typeof result.risk, 'string');
  }
});

test('classify falls back to tier "standard" when no keyword matches', () => {
  const result = classify('a perfectly ordinary request with no special words');
  assert.equal(result.tier, 'standard');
});

test('classify detects a heavy-tier keyword', () => {
  const result = classify('need to run a database migration touching the schema');
  assert.equal(result.tier, 'heavy');
});

test('classify detects a light-tier keyword', () => {
  const result = classify('fix a typo in the readme');
  assert.equal(result.tier, 'light');
});

test('classify prefers heavy over light when both kinds of keyword are present', () => {
  const result = classify('fix a typo, but it touches the security auth flow');
  assert.equal(result.tier, 'heavy');
});

test('classify falls back to kind "task" when no kind keyword matches', () => {
  const result = classify('something needs attention');
  assert.equal(result.kind, 'task');
});

test('classify infers kind "bug" from a bug keyword', () => {
  assert.equal(classify('there is a bug causing a crash').kind, 'bug');
});

test('classify infers kind "feature" from a feature keyword', () => {
  assert.equal(classify('add a new feature for exporting reports').kind, 'feature');
});

test('classify sets risk to mirror the tier signal (D5)', () => {
  const heavy = classify('run a production migration');
  assert.equal(heavy.risk, heavy.tier);
  const standard = classify('an ordinary request');
  assert.equal(standard.risk, standard.tier);
});

test('generateId always returns an id matching ID_PATTERN', () => {
  assert.match(generateId('Fix login bug', []), ID_PATTERN);
  assert.match(generateId('123 numeric start', []), ID_PATTERN);
  assert.match(generateId('', []), ID_PATTERN);
  assert.match(generateId('!!!', []), ID_PATTERN);
});

test('generateId returns a fixed tsk- prefixed id, independent of title content', () => {
  for (const title of ['Fix login bug', '123 numeric start', '', '!!!', 'a'.repeat(200)]) {
    const id = generateId(title, []);
    assert.match(id, /^tsk-[a-z0-9]{3,8}$/);
  }
});

test('generateId satisfies ID_PATTERN even when the hash digest starts with a digit', () => {
  // "title-0" is a fixed, deterministic input whose sha256->base36 digest
  // starts with a digit (verified directly) -- the exact case the bare-hash
  // approach violated on ~89% of inputs (id-systems-audit.md #1).
  const id = generateId('title-0', []);
  assert.match(id, ID_PATTERN);
  assert.match(id, /^tsk-/);
});

test('generateId retries with a longer suffix on collision, returning a different id', () => {
  const first = generateId('Duplicate title example', []);
  const second = generateId('Duplicate title example', new Set([first]));
  assert.notEqual(second, first);
  assert.match(second, ID_PATTERN);
});

test('generateId is stable for the same title and empty existingIds', () => {
  const a = generateId('Stable title', []);
  const b = generateId('Stable title', []);
  assert.equal(a, b);
});
