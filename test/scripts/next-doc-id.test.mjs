import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nextFreeId } from '../../scripts/next-doc-id.mjs';

const scriptPath = fileURLToPath(new URL('../../scripts/next-doc-id.mjs', import.meta.url));

// --- nextFreeId: pure function -------------------------------------------

test('STR pattern against STR1..STR59-shaped tokens returns 60', () => {
  const text = 'See STR1, STR12, and STR59 for context; STR59 is highest.';
  assert.equal(nextFreeId(text, 'STR(\\d+)'), 60);
});

test('RUL pattern against RUL1..RUL45 returns 46', () => {
  const text = 'RUL1 and RUL45 govern this area, RUL20 is unrelated.';
  assert.equal(nextFreeId(text, 'RUL(\\d+)'), 46);
});

test('ADR pattern against leading-zero ADR0001..ADR0015 returns 16, not corrupted by leading zeros', () => {
  const text = '- ADR0001\n- ADR0015\n- ADR0007\n';
  assert.equal(nextFreeId(text, 'ADR(\\d+)'), 16);
});

test('a string with zero matches returns 1', () => {
  assert.equal(nextFreeId('no ids in this text at all', 'STR(\\d+)'), 1);
});

// --- CLI: real end-to-end run ---------------------------------------------

test('CLI --file/--pattern invocation prints the next free id for a real fixture file', () => {
  const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'next-doc-id-'));
  const fixtureFile = path.join(fixtureDir, 'fixture.md');
  fs.writeFileSync(fixtureFile, 'STR1\nSTR2\nSTR41\n');

  const result = spawnSync(process.execPath, [scriptPath, '--file', fixtureFile, '--pattern', 'STR(\\d+)'], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), '42');

  fs.rmSync(fixtureDir, { recursive: true, force: true });
});
