import { test } from 'node:test';
import assert from 'node:assert/strict';

import { lexSource } from './js-source-lexer.mjs';

// `shape` blanks the inside of every literal, so the text of a regular expression must never show.
const shapeOf = (source) => lexSource(source).shape;

test('a slash right after an if, while or for head opens a regular expression', () => {
  for (const head of ['if (ok)', 'while (more)', 'for (const x of xs)', 'for (;;)']) {
    const shape = shapeOf(`${head} /'/.test(x) && use('kept');`);
    assert.ok(!shape.includes("'/"), `${head}: the regex text is blanked`);
    assert.match(shape, /use\(/, `${head}: code after the regex is still code`);
  }
});

test('the evasion that hid an assignments read behind an if head is lexed as code', () => {
  const source = "if (fgosDir) /'/.test(fgosDir) && fs.readdirSync(path.join(fgosDir, 'assignments'));";
  const { shape } = lexSource(source);
  assert.match(shape, /fs\.readdirSync\(path\.join\(fgosDir,/);
});

test('a slash after a call or a group is still a division', () => {
  const shape = shapeOf("const a = (b + c) / 2 / 3; const d = f(x) / 2; use('s');");
  assert.match(shape, /\(b \+ c\) \/ 2 \/ 3/);
  assert.match(shape, /f\(x\) \/ 2/);
});

test('nested parens inside an if head do not leak the header flag', () => {
  const shape = shapeOf("if (f(a) / 2 > 1) go(); const q = (z) / 4;");
  assert.match(shape, /f\(a\) \/ 2 > 1/);
  assert.match(shape, /\(z\) \/ 4/);
});
