import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  ROTATED_AUTH,
  isAuthLink,
  setAsideAuthFiles,
  setAsideReplacedAuth,
} from '../../scripts/lib/codex-auth-guard.mjs';

function scratch() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'codex-auth-guard-'));
}

test('a codex auth link that still points at the account file is left alone', () => {
  const dir = scratch();
  const target = path.join(dir, 'account-auth.json');
  fs.writeFileSync(target, '{"tokens":"real"}');
  const link = path.join(dir, 'home', 'auth.json');
  fs.mkdirSync(path.dirname(link));
  fs.symlinkSync(target, link);

  assert.equal(isAuthLink(link, target), true);
  assert.equal(setAsideReplacedAuth(link), null);
  assert.equal(fs.lstatSync(link).isSymbolicLink(), true);
  assert.deepEqual(setAsideAuthFiles(dir), []);
});

test('an auth link replaced by a plain file is set aside with its bytes, never deleted, and blocks cleaning', () => {
  const dir = scratch();
  const target = path.join(dir, 'account-auth.json');
  fs.writeFileSync(target, '{"tokens":"stale"}');
  const link = path.join(dir, 'home', 'auth.json');
  fs.mkdirSync(path.dirname(link));
  fs.writeFileSync(link, '{"tokens":"rotated"}');

  assert.equal(isAuthLink(link, target), false);
  const aside = setAsideReplacedAuth(link);

  assert.equal(aside, path.join(dir, 'home', ROTATED_AUTH));
  assert.equal(fs.readFileSync(aside, 'utf8'), '{"tokens":"rotated"}');
  assert.equal(fs.statSync(aside).mode & 0o777, 0o600);
  assert.equal(fs.existsSync(link), false);
  assert.equal(fs.readFileSync(target, 'utf8'), '{"tokens":"stale"}');
  assert.deepEqual(setAsideAuthFiles(dir), [aside]);
});
