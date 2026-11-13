import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { checkDomainRegistryCompiled } from '../../src/setup/registrations.mjs';
import { checkCompiledDomains, compileDomain } from '../../src/util/domain-compile.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function makeProject(t) {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-domain-build-'));
  t.after(() => fs.rmSync(project, { recursive: true, force: true }));
  const write = (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(project, rel)), { recursive: true });
    fs.writeFileSync(path.join(project, rel), text);
  };
  return { project, domainsDir: path.join(project, 'domains'), write };
}

test('a compiled.json whose domain has no registry.yaml is named as an orphan by the shared check and the doctor row', async (t) => {
  const { project, write } = makeProject(t);
  write('domains/ghost/compiled.json', '{"registry":{},"workflows":{}}\n');
  const { problems } = checkCompiledDomains(project);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /domains\/ghost\/compiled\.json has no registry\.yaml/);
  const row = checkDomainRegistryCompiled({ payloadRoot: project });
  assert.equal(row.passed, false);
  assert.match(row.message, /domains\/ghost\/compiled\.json has no registry\.yaml/);
});

test('two workflow files with the same key make the compile throw naming both files', (t) => {
  const { domainsDir, write } = makeProject(t);
  write('domains/demo/registry.yaml', 'defaultWorkflow: x\n');
  write('domains/demo/workflows/x.yaml', 'id: demo/x\n');
  write('domains/demo/workflows/x.yml', 'id: demo/x\n');
  assert.throws(() => compileDomain(path.join(domainsDir, 'demo')), /x\.yaml.*x\.yml|x\.yml.*x\.yaml/);
});

test('build-domain-registry --check exits green exactly when the shared check finds nothing in the real domains', () => {
  const { checked, problems } = checkCompiledDomains(root);
  assert.ok(checked > 0);
  assert.deepEqual(problems, []);
  const run = spawnSync(process.execPath, [path.join(root, 'scripts', 'build-domain-registry.mjs'), '--check'], { cwd: root, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
});
