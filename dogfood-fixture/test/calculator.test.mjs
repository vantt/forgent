import { test } from 'node:test';
import assert from 'node:assert/strict';
import { add, subtract, multiply, divide, power } from '../src/calculator.mjs';

test('add returns the sum of two numbers', () => {
  assert.equal(add(2, 3), 5);
});

test('subtract returns the difference of two numbers', () => {
  assert.equal(subtract(5, 2), 3);
});

test('multiply returns the product of two numbers', () => {
  assert.equal(multiply(4, 5), 20);
});

test('divide returns the quotient of two numbers', () => {
  assert.equal(divide(10, 2), 5);
});

test('divide by zero follows native IEEE-754 division semantics', () => {
  assert.equal(divide(1, 0), Infinity);
  assert.equal(divide(-1, 0), -Infinity);
  assert.ok(Number.isNaN(divide(0, 0)));
});

test('power returns base raised to exponent', () => {
  assert.equal(power(2, 3), 8);
});

test('power follows native ** semantics for edge-case inputs', () => {
  assert.equal(power(2, -1), 0.5);
  assert.equal(power(4, 0.5), 2);
  assert.equal(power(0, 0), 1);
});
