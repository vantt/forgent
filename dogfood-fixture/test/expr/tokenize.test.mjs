import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenize } from '../../src/expr/tokenize.mjs';

test('tokenize splits a spaced expression into number/operator tokens', () => {
  assert.deepEqual(tokenize('3 + 4 * 2'), [3, '+', 4, '*', 2]);
});

test('tokenize tolerates no whitespace at all', () => {
  assert.deepEqual(tokenize('3+4*2'), [3, '+', 4, '*', 2]);
});

test('tokenize tolerates leading/trailing whitespace', () => {
  assert.deepEqual(tokenize('  3 + 4  '), [3, '+', 4]);
});

test('tokenize handles a single-number expression (no operator)', () => {
  assert.deepEqual(tokenize('42'), [42]);
});

test('tokenize parses decimal numbers', () => {
  assert.deepEqual(tokenize('3.5 + 2'), [3.5, '+', 2]);
});

test('tokenize recognizes all 4 supported operators', () => {
  assert.deepEqual(tokenize('1 + 2 - 3 * 4 / 5'), [1, '+', 2, '-', 3, '*', 4, '/', 5]);
});

test('tokenize throws on an unrecognized character', () => {
  assert.throws(() => tokenize('3 & 4'), /unrecognized character/);
});

test('tokenize throws on a malformed number (two decimal points)', () => {
  assert.throws(() => tokenize('3.5.2 + 1'), /invalid number/);
});
