import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { listDomainDirs } from '../../src/util/domain-dirs.mjs';

function tmpDir(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-domain-dirs-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('listDomainDirs returns the domain directory names in sorted order, skipping files and links', (t) => {
  const domains = tmpDir(t);
  for (const name of ['zeta', 'alpha', 'mid']) fs.mkdirSync(path.join(domains, name));
  fs.writeFileSync(path.join(domains, 'README.md'), 'x');
  fs.symlinkSync(path.join(domains, 'alpha'), path.join(domains, 'linked'));
  assert.deepEqual(listDomainDirs(domains), ['alpha', 'mid', 'zeta']);
});

test('listDomainDirs returns an empty list for an empty or absent domains directory', (t) => {
  const domains = tmpDir(t);
  assert.deepEqual(listDomainDirs(domains), []);
  assert.deepEqual(listDomainDirs(path.join(domains, 'absent')), []);
});

test('listDomainDirs returns an empty list when the path is a file', (t) => {
  const dir = tmpDir(t);
  const file = path.join(dir, 'domains');
  fs.writeFileSync(file, 'x');
  assert.deepEqual(listDomainDirs(file), []);
});
