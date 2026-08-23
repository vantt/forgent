import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate } from '../../src/expr/evaluate.mjs';

test('evaluate calculates expression respecting operator precedence (* / before + -)', () => {
  assert.equal(evaluate([3, '+', 4, '*', 2]), 11);
});

test('evaluate calculates left-to-right for same precedence operators', () => {
  assert.equal(evaluate([10, '-', 4, '-', 2]), 4);
  assert.equal(evaluate([12, '/', 3, '*', 2]), 8);
});

test('evaluate handles single token or empty token array', () => {
  assert.equal(evaluate([42]), 42);
  assert.equal(evaluate([]), 0);
});

test('evaluate accepts string input by delegating to tokenize', () => {
  assert.equal(evaluate('3 + 4 * 2'), 11);
});

test('evaluate throws error on invalid operands or syntax', () => {
  assert.throws(() => evaluate([3, '+']), {
    name: 'Error',
  });
});
