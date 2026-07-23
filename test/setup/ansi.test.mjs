import { test } from 'node:test';
import assert from 'node:assert/strict';
import { green, red, yellow, bold, formatCheck } from '../../src/setup/ansi.mjs';

test('green wraps the input text in ANSI codes, not a plain string', () => {
  const out = green('x');
  assert.notEqual(out, 'x');
  assert.ok(out.includes('x'));
  assert.ok(out.includes('\x1b['));
});

test('red wraps the input text in ANSI codes', () => {
  const out = red('fail');
  assert.notEqual(out, 'fail');
  assert.ok(out.includes('fail'));
  assert.ok(out.includes('\x1b['));
});

test('yellow wraps the input text in ANSI codes', () => {
  const out = yellow('warn');
  assert.notEqual(out, 'warn');
  assert.ok(out.includes('warn'));
  assert.ok(out.includes('\x1b['));
});

test('bold wraps the input text in ANSI codes', () => {
  const out = bold('hi');
  assert.notEqual(out, 'hi');
  assert.ok(out.includes('hi'));
  assert.ok(out.includes('\x1b['));
});

test('formatCheck(true, label) includes a green checkmark, not a red cross', () => {
  const line = formatCheck(true, 'Node version');
  assert.ok(line.includes('✓'));
  assert.ok(!line.includes('✗'));
  assert.ok(line.includes('Node version'));
});

test('formatCheck(false, label) includes a red cross, not a green checkmark', () => {
  const line = formatCheck(false, 'git availability');
  assert.ok(line.includes('✗'));
  assert.ok(!line.includes('✓'));
  assert.ok(line.includes('git availability'));
});

test('formatCheck includes optional detail text when provided', () => {
  const line = formatCheck(false, 'config', 'missing file');
  assert.ok(line.includes('missing file'));
});

test('formatCheck omits detail suffix when not provided', () => {
  const line = formatCheck(true, 'config');
  assert.ok(!line.includes('undefined'));
  assert.ok(!line.includes('()'));
});
