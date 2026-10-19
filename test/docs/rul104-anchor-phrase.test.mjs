// test/docs/rul104-anchor-phrase.test.mjs — RUL104 ("tốt hơn, không to hơn")
// follows the RUL11 shape required by RUL9: an anchor phrase in AGENTS.md
// (doctrine layer, loaded every turn) and the locked law text in the
// platform-foundations Business Rules, both asserted here.

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const AGENTS_MD = path.join(REPO_ROOT, 'AGENTS.md');
const PLATFORM_FOUNDATIONS_SPEC = path.join(REPO_ROOT, 'docs', 'specs', 'platform-foundations.md');

const ANCHOR_PHRASE = 'tốt hơn, không to hơn';
const RUL104_LAW = fs.readFileSync(new URL('./rul104-law.txt', import.meta.url), 'utf8').trim();

test('AGENTS.md (doctrine layer, loaded every turn) contains the RUL104 anchor phrase on one unwrapped line', () => {
  const lines = fs.readFileSync(AGENTS_MD, 'utf8').split('\n');
  assert.ok(lines.some((line) => line.trim() === ANCHOR_PHRASE), `AGENTS.md must contain the anchor phrase "${ANCHOR_PHRASE}" verbatim on its own line`);
});

test('the RUL104 line in the platform-foundations Business Rules matches the locked law text word-for-word', () => {
  const spec = fs.readFileSync(PLATFORM_FOUNDATIONS_SPEC, 'utf8');
  const match = spec.match(/^- \*\*RUL104 \(tốt hơn, không to hơn\)\.\*\* (.+)$/m);
  assert.ok(match, 'Business Rules must have a "- **RUL104 (tốt hơn, không to hơn).**" line');
  assert.equal(match[1], RUL104_LAW, 'RUL104 text must match the locked wording exactly -- edit test/docs/rul104-law.txt and the spec together if the law changes');
});
