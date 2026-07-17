import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyIronLaw } from '../../src/evolve/iron-law.mjs';
import { HEAVY_KEYWORDS } from '../../src/intake/risk-keywords.mjs';
import { classify } from '../../src/intake/classify.mjs';

// The original 21 heavy keywords (D5), hardcoded here so the regression test
// asserts their behavior independently of the live list — if someone edits the
// shared array, this snapshot still pins the pre-D14 contract.
const ORIGINAL_21 = [
  'security', 'bảo mật', 'auth', 'authentication', 'payment', 'thanh toán',
  'migration', 'schema', 'data loss', 'mất dữ liệu', 'breaking change',
  'production incident', 'sự cố', 'irreversible', 'không thể hoàn tác',
  'credentials', 'secret', 'encryption', 'mã hóa', 'delete', 'xóa dữ liệu',
];

// D14's 13 additions — the intended new behavior for classify() and the new
// flags iron-law must trip.
const NEW_13 = [
  'external system', 'external api', 'third-party', 'webhook', 'hệ thống ngoài',
  'bên thứ ba', 'remove validation', 'skip validation', 'bypass validation',
  'bỏ kiểm tra', 'bỏ qua kiểm tra', 'audit', 'kiểm toán',
];

// D10+D14 module-path examples that must trip required:true via filesChanged.
const MODULE_TRIP_CASES = [
  'src/runner/loop.mjs',       // prefix src/runner/
  'src/runner/merge.mjs',      // prefix src/runner/
  'src/report/entropy.mjs',    // equals
  'src/evolve/candidates.mjs', // prefix src/evolve/
  'src/evolve/iron-law.mjs',   // prefix src/evolve/
  'bin/fgos.mjs',              // equals (whole entry file stands in for the evolve verb)
  'src/state/store.mjs',       // equals (D14)
  'src/state/fsm.mjs',         // equals (D14)
  'src/intake/risk-keywords.mjs', // equals (review-20260717-self-improve-base-workflow f1)
  'src/intake/classify.mjs',      // equals (review-20260717-self-improve-base-workflow f1)
];

// --- iron-law: flag test (description) over every HEAVY_KEYWORDS entry ---

test('classifyIronLaw covers all 34 HEAVY_KEYWORDS via description', () => {
  assert.equal(HEAVY_KEYWORDS.length, 34);
  for (const keyword of HEAVY_KEYWORDS) {
    const result = classifyIronLaw({
      filesChanged: [],
      description: `a change involving ${keyword} in the flow`,
    });
    assert.equal(result.required, true, `keyword "${keyword}" should trip required`);
    assert.ok(
      result.matchedFlags.includes(keyword),
      `keyword "${keyword}" should be named in matchedFlags`,
    );
    assert.deepEqual(result.matchedModules, []);
  }
});

test('classifyIronLaw flag match is case-insensitive', () => {
  const result = classifyIronLaw({ filesChanged: [], description: 'SECURITY incident' });
  assert.equal(result.required, true);
  assert.ok(result.matchedFlags.includes('security'));
});

test('classifyIronLaw lists every distinct keyword that matched, not just a boolean', () => {
  const result = classifyIronLaw({
    filesChanged: [],
    description: 'a payment migration touching the auth schema',
  });
  assert.deepEqual(
    result.matchedFlags.sort(),
    ['auth', 'migration', 'payment', 'schema'].sort(),
  );
});

// --- iron-law: module test (filesChanged) over every D10+D14 example ---

test('classifyIronLaw trips required for every D10+D14 module path via filesChanged', () => {
  for (const filePath of MODULE_TRIP_CASES) {
    const result = classifyIronLaw({ filesChanged: [filePath], description: undefined });
    assert.equal(result.required, true, `path "${filePath}" should trip required`);
    assert.deepEqual(result.matchedModules, [filePath]);
    assert.deepEqual(result.matchedFlags, []);
  }
});

test('classifyIronLaw lists every matching filesChanged entry in matchedModules', () => {
  const files = ['src/runner/loop.mjs', 'README.md', 'src/state/fsm.mjs'];
  const result = classifyIronLaw({ filesChanged: files, description: undefined });
  assert.deepEqual(result.matchedModules, ['src/runner/loop.mjs', 'src/state/fsm.mjs']);
  assert.equal(result.required, true);
});

test('classifyIronLaw requires a fix from modules alone when description is absent', () => {
  const result = classifyIronLaw({ filesChanged: ['src/state/store.mjs'] });
  assert.equal(result.required, true);
  assert.deepEqual(result.matchedModules, ['src/state/store.mjs']);
  assert.deepEqual(result.matchedFlags, []);
});

// --- iron-law: no-trip direction ---

test('classifyIronLaw returns required:false when neither test matches', () => {
  const result = classifyIronLaw({
    filesChanged: ['src/intake/discovery.mjs', 'docs/notes.md'],
    description: 'an ordinary refactor with no risky words',
  });
  assert.deepEqual(result, { required: false, matchedFlags: [], matchedModules: [] });
});

test('classifyIronLaw normalizes paths — a "./"-prefixed path inside a protected dir matches', () => {
  // Paths are normalized (path.posix.normalize) before matching, so './x' and
  // 'x' match identically. matchedModules reports the ORIGINAL path the caller
  // passed. ('repo/'-prefixed paths still do not match — normalize cannot strip
  // an arbitrary prefix — but per D16 filesChanged is always repo-relative.)
  const result = classifyIronLaw({
    filesChanged: ['./src/runner/loop.mjs'],
    description: undefined,
  });
  assert.deepEqual(result.matchedModules, ['./src/runner/loop.mjs']);
  assert.equal(result.required, true);
});

test('classifyIronLaw does not match a "..""-traversal that escapes every protected prefix', () => {
  // Only over-matching (false positives) is removed; under-matching (false
  // negatives) — the dangerous direction for a hard gate — is never introduced.
  const result = classifyIronLaw({
    filesChanged: ['src/runner/../evil.mjs'],
    description: undefined,
  });
  assert.deepEqual(result.matchedModules, []);
  assert.equal(result.required, false);
});

test('classifyIronLaw treats an empty-string filesChanged entry as no match, no throw', () => {
  const result = classifyIronLaw({ filesChanged: [''], description: undefined });
  assert.deepEqual(result.matchedModules, []);
  assert.equal(result.required, false);
});

test('classifyIronLaw throws a clear error when a filesChanged entry is not a string', () => {
  assert.throws(
    () => classifyIronLaw({ filesChanged: ['src/runner/loop.mjs', 42] }),
    /filesChanged\[1\] must be a string, got number/,
  );
  assert.throws(
    () => classifyIronLaw({ filesChanged: [null] }),
    /filesChanged\[0\] must be a string, got object/,
  );
});

test('classifyIronLaw throws a clear error when description is present but not a string', () => {
  assert.throws(
    () => classifyIronLaw({ filesChanged: [], description: 42 }),
    /description must be a string or omitted, got number/,
  );
});

// --- iron-law: empty / invalid input ---

test('classifyIronLaw on empty filesChanged and absent description returns required:false, no throw', () => {
  const result = classifyIronLaw({ filesChanged: [], description: undefined });
  assert.deepEqual(result, { required: false, matchedFlags: [], matchedModules: [] });
});

test('classifyIronLaw treats an empty-string description as no flags', () => {
  const result = classifyIronLaw({ filesChanged: [], description: '' });
  assert.deepEqual(result, { required: false, matchedFlags: [], matchedModules: [] });
});

test('classifyIronLaw throws a clear validation error when filesChanged is not an array', () => {
  assert.throws(() => classifyIronLaw({ filesChanged: undefined }), /filesChanged must be an array/);
  assert.throws(() => classifyIronLaw({ filesChanged: 'src/runner/loop.mjs' }), /filesChanged must be an array/);
  assert.throws(() => classifyIronLaw({}), /filesChanged must be an array/);
});

test('classifyIronLaw is pure — identical input yields identical output', () => {
  const input = { filesChanged: ['src/runner/loop.mjs'], description: 'auth change' };
  assert.deepEqual(classifyIronLaw(input), classifyIronLaw(input));
});

test('classifyIronLaw always returns array shapes, never null/undefined', () => {
  const result = classifyIronLaw({ filesChanged: ['docs/x.md'], description: 'nothing risky' });
  assert.ok(Array.isArray(result.matchedFlags));
  assert.ok(Array.isArray(result.matchedModules));
});

// --- classify.mjs regression: HEAVY_KEYWORDS extraction must not change behavior ---

test('classify still tiers every ORIGINAL 21 keyword as heavy (byte-identical regression)', () => {
  for (const keyword of ORIGINAL_21) {
    const result = classify(`a request mentioning ${keyword} directly`);
    assert.equal(result.tier, 'heavy', `"${keyword}" should tier heavy`);
    assert.equal(result.risk, 'heavy', `"${keyword}" should risk heavy`);
  }
});

test('classify newly tiers every D14 keyword as heavy (intended behavior change)', () => {
  for (const keyword of NEW_13) {
    const result = classify(`a request mentioning ${keyword} directly`);
    assert.equal(result.tier, 'heavy', `"${keyword}" should tier heavy`);
    assert.equal(result.risk, 'heavy', `"${keyword}" should risk heavy`);
  }
});
