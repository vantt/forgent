import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { compileAllDomains } from '../../scripts/build-domain-registry.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// src/state/domain-registry.mjs reads domains/<d>/compiled.json (no YAML parser, so it loads in a
// plain unpacked copy with no node_modules). The YAML is the source of truth: when it changes,
// `npm run build:domains` regenerates the compiled file.
test('every domain compiled.json matches its registry.yaml and workflows/*.yaml', () => {
  const compiled = compileAllDomains();
  assert.ok(Object.keys(compiled).length > 0, 'at least one domain must compile');
  for (const [name, expected] of Object.entries(compiled)) {
    const file = path.join(root, 'domains', name, 'compiled.json');
    assert.ok(fs.existsSync(file), `domains/${name}/compiled.json is missing — run: npm run build:domains`);
    assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')), expected, `domains/${name}/compiled.json is stale — run: npm run build:domains`);
  }
});

test('the domain registry loads with no yaml package resolvable', () => {
  // A child process whose module resolution cannot reach node_modules: copy only the sources the
  // registry needs next to a compiled domain, in a directory with no node_modules above it.
  const tmp = fs.mkdtempSync(path.join(root, '..', 'fgos-registry-nodeps-'));
  try {
    for (const rel of ['src/state/domain-registry.mjs', 'src/workflow/definition.mjs', 'src/workflow/steps.mjs', 'domains/coding/compiled.json']) {
      fs.mkdirSync(path.dirname(path.join(tmp, rel)), { recursive: true });
      fs.copyFileSync(path.join(root, rel), path.join(tmp, rel));
    }
    fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}');
    const res = spawnSync(process.execPath, ['-e', "import('./src/state/domain-registry.mjs').then(m => console.log(m.domainSteps(m.getDomain('coding')).join(',')))"], { cwd: tmp, encoding: 'utf8' });
    assert.equal(res.status, 0, res.stderr);
    assert.equal(res.stdout.trim(), 'discovery,exploring,planning,executing');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
