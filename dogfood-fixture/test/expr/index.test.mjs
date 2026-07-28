import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateExpr } from '../../src/expr/index.mjs';

test('evaluateExpr computes a spaced expression end to end', () => {
  assert.equal(evaluateExpr('3 + 4 * 2'), 11);
});

test('evaluateExpr computes an expression with no whitespace', () => {
  assert.equal(evaluateExpr('3+4*2'), 11);
});

test('evaluateExpr handles a single-number expression', () => {
  assert.equal(evaluateExpr('42'), 42);
});

test('evaluateExpr handles decimal numbers', () => {
  assert.equal(evaluateExpr('3.5 + 2.5'), 6);
});

test('evaluateExpr resolves same-precedence operators left to right', () => {
  assert.equal(evaluateExpr('10 - 2 - 3'), 5);
});

test('evaluateExpr propagates a tokenize error (unrecognized character)', () => {
  assert.throws(() => evaluateExpr('3 & 4'), /unrecognized character/);
});

test('evaluateExpr propagates an evaluate error (trailing operator)', () => {
  assert.throws(() => evaluateExpr('3 +'), /must end with a number/);
});
