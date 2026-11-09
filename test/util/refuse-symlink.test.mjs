import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { refuseSymlink } from '../../src/util/refuse-symlink.mjs';

const canLink = process.platform !== 'win32';

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-refuse-symlink-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'file.txt'), 'x');
  fs.mkdirSync(path.join(dir, 'sub'));
  return dir;
}

// The single owner of the symlink-refusal rule; every caller (distribution build, skill copies,
// dev host, doctor drift walk) goes through it and only asserts that it reaches it.
test('refuseSymlink returns the stat of a regular file and of a directory', (t) => {
  const dir = fixture(t);
  assert.ok(refuseSymlink(path.join(dir, 'file.txt'), 'test path').isFile());
  assert.ok(refuseSymlink(path.join(dir, 'sub'), 'test path').isDirectory());
});

test('refuseSymlink refuses a link to a file and names the context and the path', { skip: !canLink }, (t) => {
  const dir = fixture(t);
  const link = path.join(dir, 'link.txt');
  fs.symlinkSync(path.join(dir, 'file.txt'), link);
  assert.throws(() => refuseSymlink(link, 'release payload'), (error) => {
    assert.equal(error.message, `Symlink refused in release payload: ${link}`);
    return true;
  });
});

test('refuseSymlink refuses a link to a directory and a dangling link', { skip: !canLink }, (t) => {
  const dir = fixture(t);
  const dirLink = path.join(dir, 'dir-link');
  const dangling = path.join(dir, 'dangling');
  fs.symlinkSync(path.join(dir, 'sub'), dirLink, 'dir');
  fs.symlinkSync(path.join(dir, 'missing'), dangling);
  assert.throws(() => refuseSymlink(dirLink, 'ctx'), /Symlink refused in ctx/);
  assert.throws(() => refuseSymlink(dangling, 'ctx'), /Symlink refused in ctx/);
});

test('refuseSymlink on a missing path throws the lstat error, or returns null when absence is allowed', (t) => {
  const dir = fixture(t);
  const missing = path.join(dir, 'missing');
  assert.throws(() => refuseSymlink(missing, 'ctx'), { code: 'ENOENT' });
  assert.equal(refuseSymlink(missing, 'ctx', { optional: true }), null);
});
