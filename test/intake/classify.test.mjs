import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveTitle, classify } from '../../src/intake/classify.mjs';
import { MAX_TITLE_LENGTH } from '../../src/state/work.mjs';
import { DOMAINS, classificationVocabulary } from '../../src/state/domain-registry.mjs';

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
  assert.ok(title.length <= MAX_TITLE_LENGTH);
  assert.equal(title.endsWith('…'), true);
  assert.equal(longText.startsWith(title.slice(0, -1)), true);
  assert.equal(title.slice(0, -1).endsWith(' '), false);
});

test('deriveTitle bounds a first sentence that runs past the title bound', () => {
  // The boundary branch used to return the matched sentence whole, however
  // long it was — the case that put most stored titles past the bound.
  const runOn = `${'word '.repeat(40).trim()}. A second sentence.`;
  const title = deriveTitle(runOn);
  assert.ok(title.length <= MAX_TITLE_LENGTH);
  assert.equal(title.endsWith('…'), true);
  assert.equal(runOn.startsWith(title.slice(0, -1)), true);
});

test('deriveTitle leaves a sentence already within the bound untouched', () => {
  assert.equal(deriveTitle('Login is broken. Users cannot sign in.'), 'Login is broken');
});

test('deriveTitle cuts a single unbroken token at a hard edge', () => {
  // No space to cut at, so the word-edge rule has nothing to find and the
  // hard cut has to carry it — otherwise this exits past the bound.
  const title = deriveTitle('x'.repeat(MAX_TITLE_LENGTH + 40));
  assert.equal(title.length, MAX_TITLE_LENGTH);
});

test('deriveTitle does not cut early on a dotted filename opening the text', () => {
  assert.equal(
    deriveTitle('CONTEXT.md is the only place this lives. See the doc for detail.'),
    'CONTEXT.md is the only place this lives',
  );
});

test('deriveTitle does not cut early on a dotted source-file name opening the text', () => {
  assert.equal(
    deriveTitle('index.js exports the entry point. Nothing else does.'),
    'index.js exports the entry point',
  );
});

test('deriveTitle does not treat a mid-sentence abbreviation dot as a boundary', () => {
  assert.equal(
    deriveTitle('Update the docs, config, v.v, before shipping. Then review.'),
    'Update the docs, config, v.v, before shipping',
  );
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
    assert.equal(typeof result.size, 'string');
    assert.equal(typeof result.kind, 'string');
    assert.equal(typeof result.risk, 'string');
  }
});

test('classify falls back to size "standard" when no keyword matches', () => {
  const result = classify('a perfectly ordinary request with no special words');
  assert.equal(result.size, 'standard');
});

test('classify detects a heavy-size keyword', () => {
  const result = classify('need to run a database migration touching the schema');
  assert.equal(result.size, 'heavy');
});

test('classify detects a light-size keyword', () => {
  const result = classify('fix a typo in the readme');
  assert.equal(result.size, 'light');
});

test('classify prefers heavy over light when both kinds of keyword are present', () => {
  const result = classify('fix a typo, but it touches the security auth flow');
  assert.equal(result.size, 'heavy');
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

test('classify sets risk to mirror the size signal', () => {
  const heavy = classify('run a production migration');
  assert.equal(heavy.risk, heavy.size);
  const standard = classify('an ordinary request');
  assert.equal(standard.risk, standard.size);
});

// The verb feeds addWork directly, so anything classify() can emit has to be
// sayable under the domain's own declared vocabulary -- otherwise `fgos
// submit` would reject its own mechanical output. This is what makes "risk
// mirrors tier" above safe rather than a vocabulary leak: both fields draw
// from the same three values BY DESIGN, and the enum now says so out loud.
test('every kind/risk classify() can emit is inside coding\'s declared vocabulary', () => {
  const kinds = classificationVocabulary(DOMAINS.coding, 'kind');
  const risks = classificationVocabulary(DOMAINS.coding, 'risk');
  const samples = [
    '', 'an ordinary request', 'fix the crash', 'add a new feature',
    'refactor and cleanup the module', 'update the readme docs',
    'rename a variable', 'run a production migration on the auth table',
  ];
  for (const text of samples) {
    const { kind, risk } = classify(text);
    assert.ok(kinds.includes(kind), `kind ${JSON.stringify(kind)} from ${JSON.stringify(text)} must be declared`);
    assert.ok(risks.includes(risk), `risk ${JSON.stringify(risk)} from ${JSON.stringify(text)} must be declared`);
  }
});
