import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { green, red, yellow, bold, formatCheck, colorEnabled } from '../../src/setup/ansi.mjs';

test('green wraps the input text in ANSI codes, not a plain string', () => {
  const out = green('x', true);
  assert.notEqual(out, 'x');
  assert.ok(out.includes('x'));
  assert.ok(out.includes('\x1b['));
});

test('red wraps the input text in ANSI codes', () => {
  const out = red('fail', true);
  assert.notEqual(out, 'fail');
  assert.ok(out.includes('fail'));
  assert.ok(out.includes('\x1b['));
});

test('yellow wraps the input text in ANSI codes', () => {
  const out = yellow('warn', true);
  assert.notEqual(out, 'warn');
  assert.ok(out.includes('warn'));
  assert.ok(out.includes('\x1b['));
});

test('bold wraps the input text in ANSI codes', () => {
  const out = bold('hi', true);
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

test('colour is on only for a terminal with NO_COLOR unset', () => {
  assert.equal(colorEnabled({}, true), true);
  assert.equal(colorEnabled({}, false), false);
  assert.equal(colorEnabled({}, undefined), false);
  assert.equal(colorEnabled({ NO_COLOR: '1' }, true), false);
});

test('every helper returns plain text when colour is off', () => {
  for (const paint of [green, red, yellow, bold]) assert.equal(paint('plain', false), 'plain');
});

test('piped output carries no escape sequence by default', () => {
  const out = spawnSync(
    process.execPath,
    ['-e', "import('./src/setup/ansi.mjs').then((m) => process.stdout.write(m.formatCheck(true, 'x') + m.bold('y')))"],
    { cwd: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), encoding: 'utf8', env: { ...process.env, NO_COLOR: '' } },
  );
  assert.equal(out.stdout, '✓ xy');
});
