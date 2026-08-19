// test/docs/rul11-anchor-phrase.test.mjs — tsk-7u7: RUL11 ("khong phai no
// nang ma no tum lum") is the first RULn to carry a doctrine-layer anchor
// phrase (AGENTS.md, loaded every turn) plus a test asserting it stays
// present -- RUL9's own three rules (placement test, transport-rides-
// with-the-order, anchor-suite) require exactly this shape. RUL1-RUL10 do
// not have an equivalent test yet; this file opens the pattern rather than
// retrofitting them (item's own boundary, not a silent gap against RUL9).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const AGENTS_MD = path.join(REPO_ROOT, 'AGENTS.md');
const PLATFORM_FOUNDATIONS_SPEC = path.join(REPO_ROOT, 'docs', 'specs', 'platform-foundations.md');

const ANCHOR_PHRASE = 'khong phai no nang ma no tum lum';
const RUL11_LAW = 'Việc trở nặng không vì bản chất nó lớn mà vì thiếu và quên — tên đúng của tình trạng đó là tùm lum, không phải nặng; thấy tùm lum thì gom lại, gom tới khi hết, quy mô không bao giờ là lý do miễn trừ, đích là ranh giới rõ và contract tường minh (ADR0036 (khoá RUL11 theo đúng phát biểu gốc của người dùng, cấm diễn giải lại)).';

test('AGENTS.md (doctrine layer, loaded every turn) contains the RUL11 anchor phrase on one unwrapped line', () => {
  const agents = fs.readFileSync(AGENTS_MD, 'utf8');
  const lines = agents.split('\n');
  const hit = lines.find((line) => line.trim() === ANCHOR_PHRASE);
  assert.ok(hit, `AGENTS.md must contain the anchor phrase "${ANCHOR_PHRASE}" verbatim on its own line`);
});

test('docs/specs/platform-foundations.md Business Rules carries a **RUL11.** line', () => {
  const spec = fs.readFileSync(PLATFORM_FOUNDATIONS_SPEC, 'utf8');
  assert.match(spec, /^- \*\*RUL11.*\.\*\* /m, 'Business Rules section must have a "- **RUL11.**" line');
});

test('the RUL11 line matches the locked law text word-for-word', () => {
  const spec = fs.readFileSync(PLATFORM_FOUNDATIONS_SPEC, 'utf8');
  const match = spec.match(/^- \*\*RUL11.*\.\*\* (.+)$/m);
  assert.ok(match, 'RUL11 line must be found before comparing its text');
  assert.equal(match[1], RUL11_LAW, 'RUL11 text must match the locked wording exactly -- edit both this test and the spec together if the law changes');
});

test('the RUL11 decision narrative (D-ADR0036) is present in the "Lịch sử quyết định" section', () => {
  const spec = fs.readFileSync(PLATFORM_FOUNDATIONS_SPEC, 'utf8');
  assert.match(spec, /^### 0036 — Khoá RUL11/m, 'a "### 0036 — Khoá RUL11..." heading must exist in the decision history section');
});
