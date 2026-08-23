import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateExpr, tokenize, evaluate } from '../../src/expr/index.mjs';

test('evaluateExpr evaluates string expression to number result', () => {
  assert.equal(evaluateExpr('3 + 4 * 2'), 11);
});

test('evaluateExpr handles multi-operator complex expressions', () => {
  assert.equal(evaluateExpr('10 + 20 / 4 - 2 * 3'), 9);
});

test('evaluateExpr handles floating point and negative numbers', () => {
  assert.equal(evaluateExpr('1.5 * 4 + -2'), 4);
});

test('index re-exports tokenize and evaluate functions', () => {
  assert.equal(typeof tokenize, 'function');
  assert.equal(typeof evaluate, 'function');
});
