import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAYLOAD_ROOT, domainCatalog, listDomainDirs, readCompiledDomain } from '../../src/util/domain-dirs.mjs';

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

test('domainCatalog names each payload domain with the directories it keeps its parts in, sorted by name', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-domain-catalog-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const name of ['zeta', 'alpha']) fs.mkdirSync(path.join(root, 'domains', name), { recursive: true });
  fs.writeFileSync(path.join(root, 'domains', 'README.md'), '');
  const catalog = domainCatalog({ payloadRoot: root });
  assert.equal(catalog.root, root);
  assert.deepEqual(catalog.domains.map((domain) => domain.name), ['alpha', 'zeta']);
  assert.equal(catalog.domains[0].agentsDir, path.join(root, 'domains', 'alpha', 'agents'));
  assert.equal(catalog.domains[0].compiledPath, path.join(root, 'domains', 'alpha', 'compiled.json'));
});

test('domainCatalog with no argument answers the running payload, not the directory it is called from', () => {
  assert.equal(domainCatalog().root, PAYLOAD_ROOT);
  assert.equal(PAYLOAD_ROOT, path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..'));
  assert.ok(domainCatalog().domains.some((domain) => domain.name === 'coding'));
});

test('readCompiledDomain refuses a file with no contract or another version by name, and reads version 1', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-compiled-contract-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'compiled.json');
  fs.writeFileSync(file, JSON.stringify({ registry: {}, workflows: {} }));
  assert.throws(() => readCompiledDomain(file), /unsupported compiled domain contract null.*domain-compiled version 1/);
  fs.writeFileSync(file, JSON.stringify({ contract: { id: 'domain-compiled', version: 2 }, registry: {}, workflows: {} }));
  assert.throws(() => readCompiledDomain(file), /unsupported compiled domain contract .*"version":2/);
  fs.writeFileSync(file, JSON.stringify({ contract: { id: 'domain-compiled', version: 1 }, registry: {}, workflows: {} }));
  assert.equal(readCompiledDomain(file).contract.version, 1);
});
