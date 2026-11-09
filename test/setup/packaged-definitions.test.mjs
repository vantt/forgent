// packaged-definitions.test.mjs - the release's own definition tiers are judged here, by npm test,
// and never by `fgos doctor`: a shipped release cannot change after build. Doctor rows judge only the
// tiers a project supplies, and skip the directory that is the release source itself.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { DOCTOR_CHECKS } from '../../src/setup/checks.mjs';
import {
  checkAgentClaimsResolve,
  checkAgentTypeNamesUnique,
  checkDomainRegistryCompiled,
} from '../../src/setup/registrations.mjs';
import { INSTALL_ROOT } from '../../src/runner/agent-definitions.mjs';
import { discoverOperationPromptTemplates } from '../../src/runner/dispatch/operation-prompt-templates.mjs';
import { checkTaskSpecsResolve } from '../helpers/packaged-definitions.mjs';

const doctorRow = (id) => DOCTOR_CHECKS.find((check) => check.id === id);

test('every task-spec file a packaged domain operation or core skill names exists in the release source', () => {
  const result = checkTaskSpecsResolve();
  assert.equal(result.passed, true, result.message);
});

test('every packaged task-spec names agents and skills that the release source defines', () => {
  const result = checkAgentClaimsResolve(INSTALL_ROOT);
  assert.equal(result.passed, true, result.message);
});

test('every packaged domain has a compiled.json that parses and matches its YAML', () => {
  const result = checkDomainRegistryCompiled(INSTALL_ROOT);
  assert.equal(result.passed, true, result.message);
  assert.match(result.message, /domain registr(y|ies) compiled/);
});

test('agent-type names are unique in every tier of the release source, including its own fgos/agents', () => {
  const result = checkAgentTypeNamesUnique(INSTALL_ROOT);
  assert.equal(result.passed, true, result.message);
  assert.match(result.message, /unique within each tier/);
});

test('the packaged domain and core operation prompt templates validate', () => {
  const emptyProject = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-packaged-templates-'));
  try {
    const entries = discoverOperationPromptTemplates({ cwd: emptyProject });
    assert.ok(entries.length > 0, 'the release ships operation prompt templates');
    assert.ok(entries.every((entry) => entry.tier !== 'project'));
  } finally {
    fs.rmSync(emptyProject, { recursive: true, force: true });
  }
});

test('doctor rows skip the release source and leave its tiers to npm test', () => {
  for (const id of ['agent-claims-resolve', 'domain-registry-compiled']) {
    const result = doctorRow(id).check(INSTALL_ROOT);
    assert.equal(result.passed, true, `${id}: ${result.message}`);
    assert.match(result.message, /release source; npm test judges/, id);
  }
});

test('the agent-type row judges no tier read from inside the release, so a plain project passes with nothing to judge', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-plain-agents-'));
  try {
    const result = doctorRow('agent-type-names-unique').check(project);
    assert.equal(result.passed, true, result.message);
    assert.doesNotMatch(result.message, /fgos\/agents holds/);
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});

test('the template row reads only the project tier, so a broken packaged template cannot fail a project', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-project-templates-'));
  try {
    const result = doctorRow('operation-prompt-templates-valid').check(project);
    assert.equal(result.passed, true, result.message);
    assert.match(result.message, /^0 project operation prompt template/);
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});
