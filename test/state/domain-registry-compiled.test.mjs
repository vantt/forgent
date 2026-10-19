import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import { DOCTOR_CHECKS } from '../../src/setup/checks.mjs';
import { compileAllDomains, compileDomain } from '../../scripts/build-domain-registry.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// src/state/domain-registry.mjs reads domains/<d>/compiled.json at import time, so a YAML typo cannot
// break every verb. The YAML is the source of truth: when it changes, `npm run build:domains`
// regenerates the compiled file.
test('every domain compiled.json matches its registry.yaml and workflows/*.yaml', () => {
  const compiled = compileAllDomains();
  assert.ok(Object.keys(compiled).length > 0, 'at least one domain must compile');
  for (const [name, expected] of Object.entries(compiled)) {
    const file = path.join(root, 'domains', name, 'compiled.json');
    assert.ok(fs.existsSync(file), `domains/${name}/compiled.json is missing — run: npm run build:domains`);
    assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')), expected, `domains/${name}/compiled.json is stale — run: npm run build:domains`);
  }
});

test('the domain registry loads from compiled.json using only its own few source files', () => {
  // The registry reads a compiled domain at run time and parses no YAML: copy only the sources it
  // imports next to a compiled domain, in a directory that holds nothing else (no YAML door, no
  // vendored parser), and load it in a child process.
  const tmp = fs.mkdtempSync(path.join(root, '..', 'fgos-registry-nodeps-'));
  try {
    for (const rel of ['src/state/domain-registry.mjs', 'src/workflow/definition.mjs', 'src/workflow/guide-schema.mjs', 'src/runner/dispatch/write-scope.mjs', 'src/runner/dispatch/run-timeout.mjs', 'src/workflow/steps.mjs', 'domains/coding/compiled.json']) {
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

// The doctor check compiles from the YAML with the build's own function, so a stale or unparsable
// source is named per domain.
const compiledCheck = DOCTOR_CHECKS.find((check) => check.id === 'domain-registry-compiled').check;

function makeDomainProject(t) {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-domain-compiled-'));
  t.after(() => fs.rmSync(project, { recursive: true, force: true }));
  const write = (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(project, rel)), { recursive: true });
    fs.writeFileSync(path.join(project, rel), text);
  };
  write('domains/demo/registry.yaml', 'defaultWorkflow: main\n');
  write('domains/demo/workflows/main.yaml', 'id: demo/main\nsteps:\n  - id: first\n    phase: execute\n');
  const compile = () => write('domains/demo/compiled.json', `${JSON.stringify(compileDomain(path.join(project, 'domains', 'demo')), null, 2)}\n`);
  return { project, write, compile };
}

test('the doctor check passes for a domain whose compiled.json matches its YAML', async (t) => {
  const { project, compile } = makeDomainProject(t);
  compile();
  const result = await compiledCheck(project);
  assert.equal(result.passed, true, result.message);
});

test('the doctor check names a compiled.json that is stale against its YAML', async (t) => {
  const { project, write, compile } = makeDomainProject(t);
  compile();
  write('domains/demo/workflows/main.yaml', 'id: demo/main\nsteps:\n  - id: first\n    phase: execute\n  - id: second\n    phase: verify\n');
  const result = await compiledCheck(project);
  assert.equal(result.passed, false);
  assert.match(result.message, /domains\/demo\/compiled\.json is stale — run npm run build:domains/);
});

test('the doctor check names a domain workflow that cannot be parsed, with line and column', async (t) => {
  const { project, write, compile } = makeDomainProject(t);
  compile();
  write('domains/demo/workflows/main.yaml', 'id: demo/main\nsteps:\n  - id: first\n   phase: [\n');
  const result = await compiledCheck(project);
  assert.equal(result.passed, false);
  assert.match(result.message, /domains\/demo\/workflows\/main\.yaml: cannot be parsed: .* \(line \d+, column \d+\)/);
});

test('the doctor check still names a missing or unreadable compiled.json', async (t) => {
  const { project, write, compile } = makeDomainProject(t);
  const missing = await compiledCheck(project);
  assert.match(missing.message, /domains\/demo\/compiled\.json is missing/);
  compile();
  write('domains/demo/compiled.json', '{not json');
  assert.match((await compiledCheck(project)).message, /domains\/demo\/compiled\.json is unreadable/);
});

test('fgos doctor lists every check when a domain workflow cannot be parsed', (t) => {
  const { project, write, compile } = makeDomainProject(t);
  compile();
  write('domains/demo/workflows/main.yaml', 'id: demo/main\nsteps: [\n');
  const run = spawnSync(process.execPath, [path.join(root, 'bin', 'fgos.mjs'), 'doctor', '--json'], { cwd: project, encoding: 'utf8', env: { ...process.env, FGOS_DISABLE_OPPORTUNISTIC_CHECKS: '1' } });
  assert.equal(run.status, 0, run.stderr);
  const checks = JSON.parse(run.stdout).data.checks;
  assert.deepEqual(checks.map((c) => c.id), DOCTOR_CHECKS.map((c) => c.id));
  assert.match(checks.find((c) => c.id === 'domain-registry-compiled').message, /domains\/demo\/workflows\/main\.yaml: cannot be parsed/);
});
