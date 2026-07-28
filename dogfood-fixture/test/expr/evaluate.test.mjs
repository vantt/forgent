import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate } from '../../src/expr/evaluate.mjs';

test('evaluate applies * before + (mixed precedence)', () => {
  assert.equal(evaluate([3, '+', 4, '*', 2]), 11);
});

test('evaluate applies / before - (mixed precedence)', () => {
  assert.equal(evaluate([10, '-', 8, '/', 2]), 6);
});

test('evaluate resolves same-precedence + and - left to right', () => {
  assert.equal(evaluate([10, '-', 2, '-', 3]), 5);
});

test('evaluate resolves same-precedence * and / left to right', () => {
  assert.equal(evaluate([8, '/', 4, '/', 2]), 1);
});

test('evaluate handles a single-number token list (no operator)', () => {
  assert.equal(evaluate([5]), 5);
});

test('evaluate follows native IEEE-754 division-by-zero semantics', () => {
  assert.equal(evaluate([1, '/', 0]), Infinity);
  assert.equal(evaluate([0, '-', 1, '/', 0]), -Infinity);
});

test('evaluate throws on an empty token list', () => {
  assert.throws(() => evaluate([]), /empty token list/);
});

test('evaluate throws on a trailing operator', () => {
  assert.throws(() => evaluate([3, '+']), /must end with a number/);
});

test('evaluate throws on a leading operator', () => {
  assert.throws(() => evaluate(['+', 3]), /must start with a number/);
});

test('evaluate throws on two adjacent numbers with no operator between them', () => {
  assert.throws(() => evaluate([3, 4]), /expected an operator/);
});
