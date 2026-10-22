import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  ROTATED_AUTH,
  authRefusalAfterRun,
  isAuthLink,
  removeRunDir,
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

test('the after-run check passes an intact login and sets a replaced auth.json aside, ending its refusal with the kept path', () => {
  const dir = scratch();
  const link = path.join(dir, 'codex-home', 'auth.json');
  fs.mkdirSync(path.dirname(link));
  fs.writeFileSync(link, '{"tokens":"rotated"}');

  assert.equal(authRefusalAfterRun({ link, isLink: true, loggedIn: true, account: 'acct' }), null);
  const refusal = authRefusalAfterRun({ link, isLink: false, loggedIn: true, account: 'acct' });

  const aside = path.join(dir, 'codex-home', ROTATED_AUTH);
  assert.match(refusal, /acct codex login link broke/);
  assert.equal(refusal.split('\n').at(-1), aside, 'the last line is the kept file');
  assert.equal(fs.readFileSync(aside, 'utf8'), '{"tokens":"rotated"}');
});

test('a run directory is never removed while it holds a set-aside or replaced auth.json, and is removed once it holds neither', () => {
  const dir = scratch();
  const run = path.join(dir, 'D2');
  const target = path.join(dir, 'account-auth.json');
  fs.writeFileSync(target, '{"tokens":"stale"}');
  fs.mkdirSync(path.join(run, 'codex-home'), { recursive: true });
  // A run that died before its after-run check: the link became a plain file.
  fs.writeFileSync(path.join(run, 'codex-home', 'auth.json'), '{"tokens":"rotated"}');

  const refusal = removeRunDir(run);

  const aside = path.join(run, 'codex-home', ROTATED_AUTH);
  assert.match(refusal, /refusing to remove/);
  assert.ok(refusal.includes(aside));
  assert.equal(fs.readFileSync(aside, 'utf8'), '{"tokens":"rotated"}');
  assert.equal(removeRunDir(run), refusal, 'still refused on a second try');

  fs.renameSync(aside, path.join(dir, 'handed-to-owner.json'));
  fs.symlinkSync(target, path.join(run, 'codex-home', 'auth.json'));
  assert.equal(removeRunDir(run), null);
  assert.equal(fs.existsSync(run), false);
  assert.equal(fs.readFileSync(target, 'utf8'), '{"tokens":"stale"}', 'the linked account file is untouched');
});

test('the guard never walks into a linked directory, such as a case HOME linking the real ~/.claude', () => {
  const dir = scratch();
  const real = path.join(dir, 'real-claude');
  fs.mkdirSync(real);
  fs.writeFileSync(path.join(real, 'auth.json'), '{"real":true}');
  fs.writeFileSync(path.join(real, ROTATED_AUTH), '{"real":"rotated"}');
  const run = path.join(dir, 'L1');
  fs.mkdirSync(path.join(run, 'home'), { recursive: true });
  fs.symlinkSync(real, path.join(run, 'home', '.claude'));

  assert.deepEqual(setAsideAuthFiles(run), []);
  assert.equal(removeRunDir(run), null);
  assert.equal(fs.existsSync(run), false);
  assert.deepEqual(fs.readdirSync(real).sort(), ['auth.json', ROTATED_AUTH].sort(), 'the linked directory is untouched');
});
