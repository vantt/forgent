// packaged-definitions.test.mjs - the release's own definition tiers are judged here, by npm test,
// and never by `fgos doctor`: a shipped release cannot change after build. Doctor rows judge only the
// tiers a project supplies.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

import { DOCTOR_CHECKS } from '../../src/setup/checks.mjs';
import {
  checkAgentClaimsResolve,
  checkDomainRegistryCompiled,
} from '../../src/setup/registrations.mjs';
import { INSTALL_ROOT } from '../../src/runner/agent-definitions.mjs';

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

// The listing is the host's (`fgos agents list`, the Rust reader behind the agent-type-names-unique doctor row); the
// doctor row itself does not judge the installed release's tiers, so this test does.
test('agent-type names are unique in every tier of the release source, including its own fgos/agents, and every definition has its shape', () => {
  const host = process.env.FGOS_HOST_BIN;
  assert.ok(host, 'FGOS_HOST_BIN is not set: run this file through node scripts/run-tests.mjs');
  const run = spawnSync(host, ['agents', 'list', '--json', '--dir', INSTALL_ROOT], { cwd: INSTALL_ROOT, encoding: 'utf8', env: process.env });
  assert.equal(run.status, 0, run.stdout + run.stderr);
  const body = JSON.parse(run.stdout);
  const listing = body.data ?? body;
  assert.ok(listing.agents.length > 0, 'the release ships agent definitions');
  assert.deepEqual(listing.duplicates, []);
  assert.deepEqual(listing.ignored, []);
  assert.deepEqual(listing.agents.filter((agent) => agent.problems.length > 0).map((agent) => `${agent.source}: ${agent.problems.join('; ')}`), []);
});

// Packaged operation prompt templates: owned by packages/execution/engine/tests/contract.rs
// (`template_discovery_and_lookup_answer_as_node_did_over_every_tier_and_refusal`) over
// packages/execution/contracts/execution-contract/templates.json.


test('the domain registry row judges the running payload\'s compiled domains, in the release source too', () => {
  const result = doctorRow('domain-registry-compiled').check(INSTALL_ROOT);
  assert.equal(result.passed, true, result.message);
  assert.match(result.message, /domain registr(y|ies) compiled, readable and in step/);
});
