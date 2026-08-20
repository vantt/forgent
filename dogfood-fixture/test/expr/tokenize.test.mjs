import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenize } from '../../src/expr/tokenize.mjs';

test('tokenize splits simple arithmetic expressions', () => {
  assert.deepEqual(tokenize('3 + 4 * 2'), [3, '+', 4, '*', 2]);
});

test('tokenize handles whitespace, floating numbers, and all 4 operators', () => {
  assert.deepEqual(tokenize(' 10.5 / 2.5 - 1 '), [10.5, '/', 2.5, '-', 1]);
});

test('tokenize handles negative numbers', () => {
  assert.deepEqual(tokenize('-3 + 4 * -2'), [-3, '+', 4, '*', -2]);
});

test('tokenize throws TypeError for non-string input', () => {
  assert.throws(() => tokenize(123), {
    name: 'TypeError',
    message: 'Expression must be a string',
  });
});

test('tokenize throws Error for unsupported characters', () => {
  assert.throws(() => tokenize('3 + (4 * 2)'), {
    name: 'Error',
    message: 'Unexpected character: (',
  });
});
