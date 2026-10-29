// registrations.test.mjs — proves the doctor-check / config-default registry
// mechanism (CONTEXT.md D1/D2, docs/history/setup-doctor-config-registry/):
// a module registers a new entry via src/setup/registrations.mjs and it is
// picked up through checks.mjs's own re-exported DOCTOR_CHECKS without this
// test (or any other new module) touching checks.mjs itself.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { execFileSync, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import { DOCTOR_CHECKS, FIX_REGISTRATIONS, registerCheck, registerFix, runFixes } from '../../src/setup/checks.mjs';
import { findWorkflowStageOperationProblems, checkTaskSpecsResolve, checkDomainWorkflowOperationsCoverage } from '../../src/setup/registrations.mjs';
import { writeGlobalConfig, writeProjectConfig, writeRawLegacyProjectConfig } from '../helpers/config-fixture.mjs';


// tsk-4xg: runFixes() below invokes every registered fix, including the
// real `claude-plugin-marketplace` one, which shells out to a real,
// mutating external CLI (`claude plugin marketplace add`/`install`) when
// the `claude` binary is present. FGOS_CLAUDE_COMMAND (registrations.mjs's
// own test-only seam, mirroring bin/fgos.mjs's FGOS_GH_COMMAND for `gh`)
// points it at a path that never exists for this whole test file's process,
// so it always sees "claude CLI not found" and no-ops that fix, never
// touching this machine's real Claude Code config as a side effect of
// running the test suite.
process.env.FGOS_CLAUDE_COMMAND = '/nonexistent/fgos-test-claude-binary';

// Snapshot the real registry HERE, at module scope, before any test below
// registers a throwaway entry into these same live shared arrays. The spec
// rows the last two tests in this file compare against name only the real
// entries, so reading DOCTOR_CHECKS/FIX_REGISTRATIONS from inside a test
// would pick up throwaways and fail for the wrong reason.
const REGISTERED_CHECK_IDS = DOCTOR_CHECKS.map((c) => c.id);
const REGISTERED_FIX_IDS = FIX_REGISTRATIONS.map((f) => f.id);

const SPEC_PATH = new URL('../../docs/platform/packaging-distribution/contracts/setup-doctor-registry.md', import.meta.url);

/**
 * The ids a Data Dictionary row enumerates after its "Today's registered
 * ..." marker — the backticked tokens up to the end of that sentence, so
 * the row's surrounding prose (which backticks `registerCheck`, module
 * paths, and command names too) is never mistaken for an entry.
 */
function specEnumeratedIds(marker) {
  const spec = fs.readFileSync(SPEC_PATH, 'utf8');
  const start = spec.indexOf(marker);
  assert.notEqual(start, -1, `setup-doctor-registry.md no longer contains the marker "${marker}"`);
  const rest = spec.slice(start + marker.length);
  const end = rest.indexOf('. ');
  assert.notEqual(end, -1, `the "${marker}" enumeration is not terminated by a sentence break`);
  return [...rest.slice(0, end).matchAll(/`([^`]+)`/g)].map((m) => m[1]);
}

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-registrations-test-'));
}

test('a new module can register a check via registrations.mjs and see it in checks.mjs\'s own DOCTOR_CHECKS, without checks.mjs being edited', () => {
  const before = DOCTOR_CHECKS.length;
  registerCheck({
    id: 'registrations-test-throwaway-check',
    description: 'proves a new entry needs no checks.mjs edit',
    check: () => ({ passed: true, message: 'throwaway check ran' }),
  });
  assert.equal(DOCTOR_CHECKS.length, before + 1);
  const entry = DOCTOR_CHECKS.find((c) => c.id === 'registrations-test-throwaway-check');
  assert.ok(entry, 'DOCTOR_CHECKS (re-exported from checks.mjs) did not pick up the new registration');
  assert.deepEqual(entry.check(), { passed: true, message: 'throwaway check ran' });
});

test('registering a check with a duplicate id throws rather than silently shadowing the original', () => {
  assert.throws(
    () => registerCheck({ id: 'node-version-and-git', description: 'dup', check: () => ({ passed: true, message: '' }) }),
    /already registered/,
  );
});

// ─── fix (docs/history/doctor-fix-gate-bypass/CONTEXT.md D3, tsk-2qz-1): a
// registration capability independent of check, proven here with a throwaway entry.

test('a new module can register a fix via registrations.mjs and see it in checks.mjs\'s own FIX_REGISTRATIONS, without checks.mjs being edited', () => {
  const before = FIX_REGISTRATIONS.length;
  registerFix({
    id: 'registrations-test-throwaway-fix',
    fix: () => ({ changed: true, message: 'throwaway fix ran' }),
  });
  assert.equal(FIX_REGISTRATIONS.length, before + 1);
  const entry = FIX_REGISTRATIONS.find((f) => f.id === 'registrations-test-throwaway-fix');
  assert.ok(entry, 'FIX_REGISTRATIONS (re-exported from checks.mjs) did not pick up the new registration');
  assert.deepEqual(entry.fix(), { changed: true, message: 'throwaway fix ran' });
});

test('registering a fix with a duplicate id throws rather than silently shadowing the original', () => {
  registerFix({ id: 'registrations-test-dup-fix', fix: () => ({ changed: false, message: '' }) });
  assert.throws(
    () => registerFix({ id: 'registrations-test-dup-fix', fix: () => ({ changed: false, message: '' }) }),
    /already registered/,
  );
});

test('registerFix requires a fix function', () => {
  assert.throws(
    () => registerFix({ id: 'registrations-test-no-fn' }),
    /requires a fix function/,
  );
});

test('runFixes invokes every registered fix against the given cwd and reports id/changed/message per entry', () => {
  const before = FIX_REGISTRATIONS.length;
  registerFix({
    id: 'registrations-test-runfixes-throwaway',
    fix: (cwd) => ({ changed: true, message: `ran against ${cwd}` }),
  });
  // Every registered fix runs for real here, and the credential one sweeps and settles under HOME: a
  // throwaway HOME keeps it off the machine's own ~/.fgos.
  const savedHome = process.env.HOME;
  const throwawayHome = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-runfixes-home-'));
  process.env.HOME = throwawayHome;
  let results;
  try { results = runFixes('/tmp/some-cwd'); } finally {
    if (savedHome === undefined) delete process.env.HOME; else process.env.HOME = savedHome;
    fs.rmSync(throwawayHome, { recursive: true, force: true });
  }
  assert.equal(results.length, before + 1);
  const entry = results.find((r) => r.id === 'registrations-test-runfixes-throwaway');
  assert.deepEqual(entry, { id: 'registrations-test-runfixes-throwaway', changed: true, message: 'ran against /tmp/some-cwd' });
});

// ─── spec/registry agreement. Data Dictionary #7 and #7b used to say the
// list "grows without a spec update whenever a module registers a new one",
// which let it rot: a module registered `claude-plugin-marketplace` as both
// a check and a fix without touching the spec, and nothing noticed until a
// person audited by hand. Those rows now carry the opposite obligation —
// they name every registered entry, and a module adding one updates the row
// in the same change. These two tests are what makes that obligation real
// instead of a sentence nobody enforces.

test('Data Dictionary #7 names exactly the registered doctor checks — no missing entry, no stale one', () => {
  assert.deepEqual(
    specEnumeratedIds("Today's registered checks: ").slice().sort(),
    REGISTERED_CHECK_IDS.slice().sort(),
  );
});

test('Data Dictionary #7b names exactly the registered doctor fixes — no missing entry, no stale one', () => {
  assert.deepEqual(
    specEnumeratedIds("Today's registered fixes: ").slice().sort(),
    REGISTERED_FIX_IDS.slice().sort(),
  );
});

// ─── plugin-skill-cli-reachable (tsk-1no D3): the plugin skill layer's own
// CLI-resolution fallback, mirrored as a doctor check so a future install
// gap surfaces at `fgos doctor` time instead of at first slash-command use.

function pluginSkillCliReachableCheck() {
  const entry = DOCTOR_CHECKS.find((c) => c.id === 'plugin-skill-cli-reachable');
  assert.ok(entry, 'plugin-skill-cli-reachable must be registered');
  return entry.check;
}

test('plugin-skill-cli-reachable passes when a workspace installation exists, reporting tier 0', () => {
  const dir = mkTempDir();
  const installDir = path.join(dir, '.fgos', 'installation');
  const releaseDir = path.join(dir, 'release');
  fs.mkdirSync(installDir, { recursive: true });
  fs.mkdirSync(path.join(releaseDir, 'bin'), { recursive: true });
  fs.writeFileSync(path.join(releaseDir, 'bin', 'fgos'), '#!/bin/sh\n', { mode: 0o755 });
  fs.writeFileSync(path.join(installDir, 'activation.json'), JSON.stringify({
    schemaVersion: 1,
    status: 'ready',
    releasePath: releaseDir,
  }));
  const result = pluginSkillCliReachableCheck()(dir);
  assert.equal(result.passed, true);
  assert.match(result.message, /workspace installation found/);
});

test('plugin-skill-cli-reachable passes when a local bin/fgos.mjs exists, without touching PATH', () => {
  const dir = mkTempDir();
  fs.mkdirSync(path.join(dir, 'bin'));
  fs.writeFileSync(path.join(dir, 'bin', 'fgos.mjs'), '// stub\n');
  const result = pluginSkillCliReachableCheck()(dir);
  assert.equal(result.passed, true);
  assert.match(result.message, /local bin\/fgos\.mjs found/);
});

test('plugin-skill-cli-reachable passes when no local bin/fgos.mjs exists but fgos resolves from PATH', () => {
  const dir = mkTempDir();
  const binDir = mkTempDir();
  const stubPath = path.join(binDir, 'fgos');
  fs.writeFileSync(stubPath, '#!/bin/sh\necho stub\n');
  fs.chmodSync(stubPath, 0o755);
  const originalPath = process.env.PATH;
  process.env.PATH = `${binDir}${path.delimiter}${originalPath}`;
  try {
    const result = pluginSkillCliReachableCheck()(dir);
    assert.equal(result.passed, true);
    assert.match(result.message, /fgos resolved from PATH/);
  } finally {
    process.env.PATH = originalPath;
  }
});

test('plugin-skill-cli-reachable fails when neither a local bin/fgos.mjs, a project-local install, a cached global path, nor a live PATH install exists', () => {
  const dir = mkTempDir();
  // HOME override (tsk-2qc-1): resolveFgosBin's tier-3 cache reads
  // ~/.fgos/config.json by default -- without this override, a real
  // cached bin.globalFgosPath left on the machine running this test
  // (from a real `fgos setup`/`doctor --fix` run) would make this check
  // pass for the wrong reason. Same isolation discipline the
  // shell-integration-sourced tests already apply via HOME (checks.test.mjs).
  const homeDir = mkTempDir();
  const originalPath = process.env.PATH;
  const originalHome = process.env.HOME;
  const originalUserProfile = process.env.USERPROFILE;
  process.env.PATH = '';
  process.env.HOME = homeDir;
  process.env.USERPROFILE = homeDir;
  try {
    const result = pluginSkillCliReachableCheck()(dir);
    assert.equal(result.passed, false);
    assert.match(result.message, /no bin\/fgos\.mjs at .* and no global fgos install on PATH/);
  } finally {
    process.env.PATH = originalPath;
    if (originalHome === undefined) delete process.env.HOME; else process.env.HOME = originalHome;
    if (originalUserProfile === undefined) delete process.env.USERPROFILE; else process.env.USERPROFILE = originalUserProfile;
  }
});

// ─── cli-version-visible (tsk-2ej): the running build's own package
// version/commit/verb-set resolve cleanly -- the "always green on a
// healthy build" self-check pattern node-version-and-git already uses, so
// fgos doctor's own report always surfaces the first thing worth comparing
// when a verb comes back "unknown" on some other machine.

function cliVersionVisibleCheck() {
  const entry = DOCTOR_CHECKS.find((c) => c.id === 'cli-version-visible');
  assert.ok(entry, 'cli-version-visible must be registered');
  return entry.check;
}

test('cli-version-visible passes and its message embeds the resolved packageVersion', () => {
  const result = cliVersionVisibleCheck()();
  assert.equal(result.passed, true);
  const { version: packageVersion } = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
  assert.ok(result.message.includes(packageVersion), `message "${result.message}" missing packageVersion "${packageVersion}"`);
});

// ─── plugin-dev-skills-packaged (tsk-32b): confirms the coding-domain
// dev-skills plugin-skill-cli-reachable never checked (fgos-coding-driving,
// fgos-routing, ...) are actually present in plugins/fgOS/skills/, so a
// maintainer who adds/renames one in .claude/skills/ but forgets to copy it
// forward gets caught at `fgos doctor` time instead of shipping silently.

function pluginDevSkillsPackagedCheck() {
  const entry = DOCTOR_CHECKS.find((c) => c.id === 'plugin-dev-skills-packaged');
  assert.ok(entry, 'plugin-dev-skills-packaged must be registered');
  return entry.check;
}

test('plugin-dev-skills-packaged passes cleanly when the project has no .claude/skills or plugins/fgOS/skills at all', () => {
  const dir = mkTempDir();
  const result = pluginDevSkillsPackagedCheck()(dir);
  assert.equal(result.passed, true);
  assert.match(result.message, /not a forgent checkout/);
});

test('plugin-dev-skills-packaged passes when every .claude/skills/fgos-* dev-skill has a matching plugins/fgOS/skills/ copy', () => {
  const dir = mkTempDir();
  fs.mkdirSync(path.join(dir, '.claude', 'skills', 'fgos-example'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.claude', 'skills', 'fgos-example', 'SKILL.md'), '# example\n');
  fs.mkdirSync(path.join(dir, 'plugins', 'fgOS', 'skills', 'fgos-example'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'plugins', 'fgOS', 'skills', 'fgos-example', 'SKILL.md'), '# example\n');
  const result = pluginDevSkillsPackagedCheck()(dir);
  assert.equal(result.passed, true);
  assert.match(result.message, /all 1 coding-domain dev-skills are packaged/);
});

test('plugin-dev-skills-packaged fails and names any .claude/skills/fgos-* dev-skill missing from plugins/fgOS/skills/', () => {
  const dir = mkTempDir();
  fs.mkdirSync(path.join(dir, '.claude', 'skills', 'fgos-example'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.claude', 'skills', 'fgos-example', 'SKILL.md'), '# example\n');
  fs.mkdirSync(path.join(dir, 'plugins', 'fgOS', 'skills'), { recursive: true });
  const result = pluginDevSkillsPackagedCheck()(dir);
  assert.equal(result.passed, false);
  assert.match(result.message, /fgos-example/);
  assert.match(result.message, /Unknown skill/);
});

test('task-specs-resolve doctor check passes when core/task-specs/ and domain task-specs exist', () => {
  const entry = DOCTOR_CHECKS.find((c) => c.id === 'task-specs-resolve');
  assert.ok(entry, 'task-specs-resolve check must be registered');
  const result = entry.check(process.cwd());
  assert.equal(result.passed, true, `task-specs-resolve failed: ${result.message}`);
});

test('task-spec and workflow-operation checks pass on a plain target project that carries no fgOS trees', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-plain-target-'));
  try {
    assert.equal(fs.existsSync(path.join(project, 'domains')), false);
    assert.equal(fs.existsSync(path.join(project, 'core')), false);
    for (const id of ['task-specs-resolve', 'domain-workflow-operations-coverage']) {
      const entry = DOCTOR_CHECKS.find((c) => c.id === id);
      const result = entry.check(project);
      assert.equal(result.passed, true, `${id} failed on a plain target: ${result.message}`);
    }
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});

test('task-spec and workflow-operation checks still fail when the install root lacks its own task-specs', () => {
  const emptyRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-broken-install-'));
  try {
    const specs = checkTaskSpecsResolve(emptyRoot);
    assert.equal(specs.passed, false);
    assert.match(specs.message, /missing task-spec file/);
    const coverage = checkDomainWorkflowOperationsCoverage(emptyRoot, emptyRoot);
    assert.equal(coverage.passed, false);
    assert.match(coverage.message, /not found/);
  } finally {
    fs.rmSync(emptyRoot, { recursive: true, force: true });
  }
});

test('agent-type-names-unique doctor check passes when agent-type names are unique within each tier', () => {
  const entry = DOCTOR_CHECKS.find((c) => c.id === 'agent-type-names-unique');
  assert.ok(entry, 'agent-type-names-unique check must be registered');
  const result = entry.check(process.cwd());
  assert.equal(result.passed, true, `agent-type-names-unique failed: ${result.message}`);
});

test('agent-type-names-unique doctor check fails on a duplicate within one tier and accepts a higher tier replacing a lower one', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-unique-test-'));
  try {
    const write = (rel, name) => {
      fs.mkdirSync(path.join(tempDir, path.dirname(rel)), { recursive: true });
      fs.writeFileSync(path.join(tempDir, rel), `name: ${name}\ndescription: a persona\n`);
    };
    const entry = DOCTOR_CHECKS.find((c) => c.id === 'agent-type-names-unique');

    // A name in core, a domain and the workspace is three tiers replacing one another, not a duplicate.
    write('core/agents/dup-agent.yaml', 'dup-agent');
    write('domains/coding/agents/dup-agent.yaml', 'dup-agent');
    write('fgos/agents/dup-agent.yaml', 'dup-agent');
    const shadowing = entry.check(tempDir);
    assert.equal(shadowing.passed, true, shadowing.message);
    assert.match(shadowing.message, /dup-agent \(replaces domains\/coding\/agents\/dup-agent\.yaml\)/);

    // The same name in two domains is one tier defining it twice.
    write('domains/finance/agents/dup-agent.yaml', 'dup-agent');
    const sameTier = entry.check(tempDir);
    assert.equal(sameTier.passed, false);
    assert.match(sameTier.message, /duplicate agent-type name "dup-agent" in domains\/\*\/agents/);
    assert.match(sameTier.message, /domains\/coding\/agents\/dup-agent\.yaml, domains\/finance\/agents\/dup-agent\.yaml/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('agent-type-names-unique doctor check reports a workspace definition with the wrong shape or extension', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-shape-test-'));
  try {
    const dir = path.join(tempDir, 'fgos', 'agents');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'wrong-name.yaml'), 'name: other\ndescription: a persona\n');
    fs.writeFileSync(path.join(dir, 'no-description.yaml'), 'name: no-description\n');
    fs.writeFileSync(path.join(dir, 'typo.yml'), 'name: typo\ndescription: a persona\n');
    const entry = DOCTOR_CHECKS.find((c) => c.id === 'agent-type-names-unique');
    const result = entry.check(tempDir);
    assert.equal(result.passed, false);
    assert.match(result.message, /fgos\/agents\/wrong-name\.yaml: must declare name: wrong-name/);
    assert.match(result.message, /fgos\/agents\/no-description\.yaml: must declare a non-empty description/);
    assert.match(result.message, /fgos\/agents\/typo\.yml is ignored: only \.yaml files are read/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

// --- workflow step operations validation (Step 02 / D19) ---
// These fixtures state a workflow's operations as `operationMap`/`skillMap` keyed by step; the check
// reads Workflow definitions (`steps[].operations`, `steps[].skill`), so they are lifted into that shape.
function asWorkflowDomains(domains) {
  const lifted = {};
  for (const [domainName, domain] of Object.entries(domains)) {
    const workflows = {};
    for (const [wfName, wf] of Object.entries(domain.workflows ?? {})) {
      workflows[wfName] = {
        steps: Object.entries(wf.operationMap ?? {}).map(([id, operations]) => ({
          id,
          operations,
          ...(wf.skillMap?.[id] ? { skill: wf.skillMap[id] } : {}),
        })),
      };
    }
    lifted[domainName] = { ...domain, workflows };
  }
  return lifted;
}


test('findWorkflowStageOperationProblems passes on the live repository setup', () => {
  const problems = findWorkflowStageOperationProblems(mkTempDir());
  assert.deepEqual(problems, []);
});

test('findWorkflowStageOperationProblems fails when operation taskSpec does not resolve', () => {
  const customDomains = {
    coding: {
      workflows: {
        feature: {
          operationMap: {
            planning: [
              { id: 'bad-task', taskSpec: 'nonexistent-task-spec-file', role: 'implementer', skills: ['fgos-coding-planning'] },
            ],
          },
        },
      },
    },
  };
  const problems = findWorkflowStageOperationProblems(mkTempDir(), asWorkflowDomains(customDomains));
  assert.equal(problems.length > 0, true);
  assert.match(problems[0], /nonexistent-task-spec-file/);
});

test('findWorkflowStageOperationProblems fails when operation role is not in roleGraph.roles', () => {
  const customDomains = {
    coding: {
      roleGraph: {
        roles: ['implementer', 'researcher'],
      },
      workflows: {
        feature: {
          operationMap: {
            planning: [
              { id: 'shape-plan', taskSpec: 'shape-plan', role: 'unknown-role-xyz', skills: ['fgos-coding-planning'] },
            ],
          },
        },
      },
    },
  };
  const problems = findWorkflowStageOperationProblems(mkTempDir(), asWorkflowDomains(customDomains));
  assert.equal(problems.length > 0, true);
  assert.match(problems[0], /unknown-role-xyz/);
});

test('findWorkflowStageOperationProblems fails when operation skill is not provided by any agent-type', () => {
  const customDomains = {
    coding: {
      workflows: {
        feature: {
          operationMap: {
            planning: [
              { id: 'shape-plan', taskSpec: 'shape-plan', role: 'implementer', skills: ['fgos-completely-fake-skill-123'] },
            ],
          },
        },
      },
    },
  };
  const problems = findWorkflowStageOperationProblems(mkTempDir(), asWorkflowDomains(customDomains));
  assert.equal(problems.length > 0, true);
  assert.match(problems[0], /fgos-completely-fake-skill-123/);
});

test('findWorkflowStageOperationProblems fails when operation reason has no matching roleGraph edge', () => {
  const customDomains = {
    coding: {
      roleGraph: {
        roles: ['implementer', 'reviewer'],
        edges: {
          planning: [
            { from: 'implementer', to: 'researcher', reason: 'consult', mode: 'sync' },
          ],
        },
      },
      workflows: {
        feature: {
          operationMap: {
            planning: [
              { id: 'validate-plan', taskSpec: 'validate-plan', role: 'reviewer', reason: 'review', skills: ['fgos-coding-validating'] },
            ],
          },
        },
      },
    },
  };
  const problems = findWorkflowStageOperationProblems(mkTempDir(), asWorkflowDomains(customDomains));
  assert.equal(problems.length > 0, true);
  assert.match(problems[0], /does not match any legal roleGraph edge/);
});

test('findWorkflowStageOperationProblems fails when multiple operations are marked primary: true', () => {
  const customDomains = {
    coding: {
      workflows: {
        feature: {
          operationMap: {
            planning: [
              { id: 'shape-plan', primary: true, taskSpec: 'shape-plan', role: 'implementer', skills: ['fgos-coding-planning'] },
              { id: 'scout-blast-radius', primary: true, taskSpec: 'scout-blast-radius', role: 'researcher', skills: ['fgos-researching'] },
            ],
          },
        },
      },
    },
  };
  const problems = findWorkflowStageOperationProblems(mkTempDir(), asWorkflowDomains(customDomains));
  assert.equal(problems.length > 0, true);
  assert.match(problems[0], /2 operations marked primary: true/);
});

test('findWorkflowStageOperationProblems fails when the primary operation does not carry the step skill', () => {
  const customDomains = {
    coding: {
      workflows: {
        feature: {
          skillMap: { planning: 'fgos-coding-planning' },
          operationMap: {
            planning: [
              { id: 'validate-plan', primary: true, taskSpec: 'validate-plan', role: 'reviewer', skills: ['fgos-coding-validating'] },
            ],
          },
        },
      },
    },
  };
  const problems = findWorkflowStageOperationProblems(mkTempDir(), asWorkflowDomains(customDomains));
  assert.ok(problems.some((p) => p.includes('does not include step skill')));
});

test('findWorkflowStageOperationProblems fails when policy rigor or preferPersona is invalid', () => {
  const customDomains = {
    coding: {
      workflows: {
        feature: {
          operationMap: {
            planning: [
              {
                id: 'shape-plan',
                taskSpec: 'shape-plan',
                role: 'implementer',
                skills: ['fgos-coding-planning'],
                policy: { rigor: 'ultra-mega-rigor', preferPersona: 'alien-persona' },
              },
            ],
          },
        },
      },
    },
  };
  const problems = findWorkflowStageOperationProblems(mkTempDir(), asWorkflowDomains(customDomains));
  assert.equal(problems.length >= 2, true);
  assert.ok(problems.some((p) => p.includes('policy.rigor')));
  assert.ok(problems.some((p) => p.includes('policy.preferPersona')));
});

test('findWorkflowStageOperationProblems fails on invalid dispatch mode or human-only with executor policy', () => {
  const customDomains = {
    coding: {
      workflows: {
        feature: {
          operationMap: {
            planning: [
              {
                id: 'bad-dispatch',
                taskSpec: 'shape-plan',
                role: 'implementer',
                skills: ['fgos-coding-planning'],
                dispatch: 'robot-only',
              },
              {
                id: 'bad-human-only',
                taskSpec: 'shape-plan',
                role: 'implementer',
                skills: ['fgos-coding-planning'],
                dispatch: 'human-only',
                policy: { preferExecutor: 'claude' },
              },
            ],
          },
        },
      },
    },
  };
  const problems = findWorkflowStageOperationProblems(mkTempDir(), asWorkflowDomains(customDomains));
  assert.ok(problems.some((p) => p.includes('invalid dispatch mode "robot-only"')));
  assert.ok(problems.some((p) => p.includes('dispatch: human-only operation must not declare executor policy')));
});

test('findWorkflowStageOperationProblems fails on invalid preferExecutor or visibility, and refuses the removed fallbackExecutors key', () => {
  const customDomains = {
    coding: {
      workflows: {
        feature: {
          operationMap: {
            planning: [
              {
                id: 'op1',
                taskSpec: 'shape-plan',
                role: 'implementer',
                skills: ['fgos-coding-planning'],
                policy: {
                  preferExecutor: 'does-not-exist',
                  visibility: 'opaque',
                },
              },
              {
                id: 'op2',
                taskSpec: 'shape-plan',
                role: 'implementer',
                skills: ['fgos-coding-planning'],
                policy: {
                  fallbackExecutors: ['pi'],
                },
              },
            ],
          },
        },
      },
    },
  };
  const problems = findWorkflowStageOperationProblems(mkTempDir(), asWorkflowDomains(customDomains));
  assert.ok(problems.some((p) => p.includes('policy.preferExecutor "does-not-exist" is not a recognized executor')));
  assert.ok(problems.some((p) => p.includes('policy.visibility "opaque" must be "headless" or "visible"')));
  assert.ok(problems.some((p) => p.includes('policy contains disallowed key(s) [fallbackExecutors]')));
});

test('findWorkflowStageOperationProblems fails on duplicate operation id or empty id', () => {
  const customDomains = {
    coding: {
      workflows: {
        feature: {
          operationMap: {
            planning: [
              { id: 'duplicate-id', taskSpec: 'shape-plan', role: 'implementer', skills: ['fgos-coding-planning'] },
              { id: 'duplicate-id', taskSpec: 'shape-plan', role: 'implementer', skills: ['fgos-coding-planning'] },
              { id: '', taskSpec: 'shape-plan', role: 'implementer', skills: ['fgos-coding-planning'] },
            ],
          },
        },
      },
    },
  };
  const problems = findWorkflowStageOperationProblems(mkTempDir(), asWorkflowDomains(customDomains));
  assert.ok(problems.some((p) => p.includes('duplicate operation id "duplicate-id"')));
  assert.ok(problems.some((p) => p.includes('operation id must be a non-empty string')));
});

test('findWorkflowStageOperationProblems fails when required fields taskSpec, role, or skills are missing or empty', () => {
  const customDomains = {
    coding: {
      roleGraph: {
        roles: ['implementer', 'researcher', 'reviewer'],
      },
      workflows: {
        feature: {
          operationMap: {
            planning: [
              { id: 'missing-taskSpec', role: 'implementer', skills: ['fgos-coding-planning'] },
              { id: 'missing-role', taskSpec: 'shape-plan', skills: ['fgos-coding-planning'] },
              { id: 'missing-skills', taskSpec: 'shape-plan', role: 'implementer' },
              { id: 'empty-skills', taskSpec: 'shape-plan', role: 'implementer', skills: [] },
            ],
          },
        },
      },
    },
  };
  const problems = findWorkflowStageOperationProblems(mkTempDir(), asWorkflowDomains(customDomains));
  assert.ok(problems.some((p) => p.includes('missing-taskSpec') && p.includes('taskSpec must be a non-empty string')));
  assert.ok(problems.some((p) => p.includes('missing-role') && p.includes('role must be a non-empty string in roleGraph.roles')));
  assert.ok(problems.some((p) => p.includes('missing-skills') && p.includes('skills must be an array of strings')));
  assert.ok(problems.some((p) => p.includes('empty-skills') && p.includes('skills must be a non-empty array of skill names')));
});

test('findWorkflowStageOperationProblems strictly enforces role as TARGET role (to) for reason edges', () => {
  const customDomains = {
    coding: {
      roleGraph: {
        roles: ['implementer', 'researcher', 'reviewer'],
        edges: {
          executing: [
            // reviewer -> researcher (consult)
            { from: 'reviewer', to: 'researcher', reason: 'consult', mode: 'sync' },
          ],
        },
      },
      workflows: {
        feature: {
          operationMap: {
            executing: [
              // An operation declaring role: reviewer with reason: consult should NOT match reviewer -> researcher edge
              // because reviewer is the SOURCE (from), not the TARGET (to).
              { id: 'bad-target-op', taskSpec: 'resolve-question', role: 'reviewer', reason: 'consult', skills: ['fgos-researching'] },
              // While role: researcher with reason: consult correctly matches
              { id: 'good-target-op', taskSpec: 'resolve-question', role: 'researcher', reason: 'consult', skills: ['fgos-researching'] },
            ],
          },
        },
      },
    },
  };
  const problems = findWorkflowStageOperationProblems(mkTempDir(), asWorkflowDomains(customDomains));
  assert.ok(problems.some((p) => p.includes('bad-target-op') && p.includes('does not match any legal roleGraph edge')));
  assert.ok(!problems.some((p) => p.includes('good-target-op')));
});

test('findWorkflowStageOperationProblems fails when policy contains disallowed keys', () => {
  const customDomains = {
    coding: {
      workflows: {
        feature: {
          operationMap: {
            planning: [
              {
                id: 'shape-plan',
                taskSpec: 'shape-plan',
                role: 'implementer',
                skills: ['fgos-coding-planning'],
                policy: {
                  rigor: 'standard',
                  model: 'gpt-5.5',
                  timeoutMs: 999999,
                  prompt: 'Do something',
                },
              },
            ],
          },
        },
      },
    },
  };
  const problems = findWorkflowStageOperationProblems(mkTempDir(), asWorkflowDomains(customDomains));
  assert.ok(problems.some((p) => p.includes('policy contains disallowed key(s) [model, timeoutMs, prompt]')));
});

test('findWorkflowStageOperationProblems fails when a step\'s operations is not an array', () => {
  const customDomainsNonArray = {
    coding: {
      workflows: {
        feature: {
          operationMap: {
            planning: 'not-an-array-string',
            discovery: { id: 'not-an-array-obj' },
          },
        },
      },
    },
  };
  const problemsNonArray = findWorkflowStageOperationProblems(mkTempDir(), asWorkflowDomains(customDomainsNonArray));
  assert.ok(problemsNonArray.some((p) => p.includes('coding.feature.planning.operations: must be an array of operation objects')));
  assert.ok(problemsNonArray.some((p) => p.includes('coding.feature.discovery.operations: must be an array of operation objects')));
});

test('domain-workflow-operations-coverage doctor check is registered and passes on clean repo', () => {
  const check = DOCTOR_CHECKS.find((c) => c.id === 'domain-workflow-operations-coverage');
  assert.ok(check, 'domain-workflow-operations-coverage doctor check must be registered');
  const result = check.check(mkTempDir());
  assert.equal(result.passed, true);
  assert.match(result.message, /every step operation across domain workflows resolves/);
});

test('doctor check runner-generated-paths accepts the standard\'s empty list or a well-formed one and flags a malformed one', () => {
  const tmpDir = mkTempDir();
  const fgosDir = path.join(tmpDir, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  const write = (runner) => writeProjectConfig(tmpDir, { runner });
  const check = DOCTOR_CHECKS.find((c) => c.id === 'runner-generated-paths');
  assert.ok(check, 'runner-generated-paths doctor check must be registered');

  const standard = check.check(tmpDir);
  assert.equal(standard.passed, true);
  assert.match(standard.message, /valid \(0 mapping/);

  write({ generatedPaths: [{ from: 'core/skills/**', also: ['.agents/skills/**'] }] });
  const valid = check.check(tmpDir);
  assert.equal(valid.passed, true);
  assert.match(valid.message, /valid/);

  write({ generatedPaths: [{ from: '**', also: ['x'] }] });
  const bare = check.check(tmpDir);
  assert.equal(bare.passed, false);
  assert.match(bare.message, /generatedPaths\[0\]\.from/);

  write({ generatedPaths: [{ from: 'core', also: ['x'], extra: true }] });
  const unknownKey = check.check(tmpDir);
  assert.equal(unknownKey.passed, false);
  assert.match(unknownKey.message, /unknown key "extra"|config-schema/);
});

test('doctor check runner-patterns-config: passes on the standard', () => {
  const tmpDir = mkTempDir();
  const check = DOCTOR_CHECKS.find((c) => c.id === 'runner-patterns-config');
  assert.ok(check, 'runner-patterns-config doctor check must be registered');
  const res = check.check(tmpDir);
  assert.equal(res.passed, true);
  assert.match(res.message, /valid/);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('doctor check runner-patterns-config: a retired key in the project file fails naming the file and runner.loops.reviewed', () => {
  const tmpDir = mkTempDir();
  const check = DOCTOR_CHECKS.find((c) => c.id === 'runner-patterns-config');
  writeProjectConfig(tmpDir, {
    runner: {
      patterns: {
        reviewed: { maxRounds: 3 },
      },
    },
  });
  const res = check.check(tmpDir);
  assert.equal(res.passed, false);
  assert.match(res.message, new RegExp(path.join(tmpDir, '.fgos', 'config.yaml').replace(/[/\\?*]/g, '\\$&')));
  assert.match(res.message, /runner\.loops\.reviewed/);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
test('doctor check runner-patterns-config: a legacy json project file is left to the config-format-legacy-json row', () => {
  const tmpDir = mkTempDir();
  writeRawLegacyProjectConfig(tmpDir, JSON.stringify({ runner: { patterns: { reviewed: { maxRounds: 3 } } } }));
  const patterns = DOCTOR_CHECKS.find((c) => c.id === 'runner-patterns-config').check(tmpDir);
  assert.equal(patterns.passed, true);
  assert.match(patterns.message, /config-format-legacy-json/);
  const door = DOCTOR_CHECKS.find((c) => c.id === 'config-format-legacy-json').check(tmpDir);
  assert.equal(door.passed, false);
  assert.match(door.message, /project:config\.json/);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('doctor check runner-patterns-config: valid reviewed pattern override passes', () => {
  const tmpDir = mkTempDir();
  const check = DOCTOR_CHECKS.find((c) => c.id === 'runner-patterns-config');
  writeProjectConfig(tmpDir, {
    runner: {
      patterns: {
        reviewed: {
          defaults: { maxRounds: 3 },
        },
      },
    },
  });
  const res = check.check(tmpDir);
  assert.equal(res.passed, true);
  assert.match(res.message, /valid/);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('doctor check runner-patterns-config: registers no automatic fix', () => {
  const fix = FIX_REGISTRATIONS.find((f) => f.id === 'runner-patterns-config');
  assert.equal(fix, undefined, 'runner-patterns-config doctor row must register no automatic fix');
});

test('doctor check runner-patterns-config: a retired key in the global file fails naming the global path', () => {
  const home = mkTempDir();
  const repo = mkTempDir();
  const saved = { HOME: process.env.HOME, USERPROFILE: process.env.USERPROFILE };
  process.env.HOME = home;
  process.env.USERPROFILE = home;
  try {
    writeGlobalConfig(home, {
      runner: {
        patterns: {
          reviewed: { maxRounds: 3 },
        },
      },
    });
    const check = DOCTOR_CHECKS.find((c) => c.id === 'runner-patterns-config');
    const res = check.check(repo);
    assert.equal(res.passed, false);
    assert.match(res.message, new RegExp(path.join(home, '.fgos', 'config.yaml').replace(/[/\\?*]/g, '\\$&')));
    assert.match(res.message, /runner\.loops\.reviewed/);
  } finally {
    process.env.HOME = saved.HOME;
    if (saved.USERPROFILE !== undefined) process.env.USERPROFILE = saved.USERPROFILE;
    else delete process.env.USERPROFILE;
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test('doctor check runner-patterns-config: a default beyond a bound warns', () => {
  const tmpDir = mkTempDir();
  const check = DOCTOR_CHECKS.find((c) => c.id === 'runner-patterns-config');
  writeProjectConfig(tmpDir, {
    runner: {
      loops: {
        reviewed: {
          bounds: {
            maxRounds: { min: 1, max: 2 },
          },
        },
      },
      patterns: {
        'heavy-review': {
          loop: 'reviewed',
          promise: 'a heavy review',
          defaults: {
            maxRounds: 5,
          },
        },
      },
    },
  });
  const res = check.check(tmpDir);
  assert.equal(res.passed, true);
  assert.match(res.message, /^warning:/);
  assert.match(res.message, /beyond.*bound|unclamped/i);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
test('doctor check runner-patterns-config: warns when project defines loops with marker 1', () => {
  const tmpDir = mkTempDir();
  const check = DOCTOR_CHECKS.find((c) => c.id === 'runner-patterns-config');
  writeProjectConfig(tmpDir, {
    runner: {
      loops: {
        reviewed: { maxRounds: 3 },
      },
      patterns: {
        seatBinding: { schema: 1 },
      },
    },
  });
  const res = check.check(tmpDir);
  assert.equal(res.passed, true);
  assert.match(res.message, /^warning:/);
  assert.match(res.message, /set `runner\.patterns\.seatBinding\.schema` to 2 so older releases refuse this file/);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('doctor check runner-patterns-config: warns when project defines loops with absent marker', () => {
  const tmpDir = mkTempDir();
  const check = DOCTOR_CHECKS.find((c) => c.id === 'runner-patterns-config');
  writeProjectConfig(tmpDir, {
    runner: {
      loops: {
        reviewed: { maxRounds: 3 },
      },
    },
  });
  const res = check.check(tmpDir);
  assert.equal(res.passed, true);
  assert.match(res.message, /^warning:/);
  assert.match(res.message, /set `runner\.patterns\.seatBinding\.schema` to 2 so older releases refuse this file/);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('doctor check runner-patterns-config: passes without marker warning when project defines loops with marker 2', () => {
  const tmpDir = mkTempDir();
  const check = DOCTOR_CHECKS.find((c) => c.id === 'runner-patterns-config');
  writeProjectConfig(tmpDir, {
    runner: {
      loops: {
        reviewed: { maxRounds: 3 },
      },
      patterns: {
        seatBinding: { schema: 2 },
      },
    },
  });
  const res = check.check(tmpDir);
  assert.equal(res.passed, true);
  assert.doesNotMatch(res.message ?? '', /seatBinding\.schema/);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('doctor check runner-patterns-config: passes without project marker warning when loops are defined only in global', () => {
  const home = mkTempDir();
  const repo = mkTempDir();
  const saved = { HOME: process.env.HOME, USERPROFILE: process.env.USERPROFILE };
  process.env.HOME = home;
  process.env.USERPROFILE = home;
  try {
    writeGlobalConfig(home, {
      runner: {
        loops: {
          reviewed: { maxRounds: 3 },
        },
      },
    });
    writeProjectConfig(repo, {
      runner: {},
    });
    const check = DOCTOR_CHECKS.find((c) => c.id === 'runner-patterns-config');
    const res = check.check(repo);
    assert.equal(res.passed, true);
    assert.doesNotMatch(res.message ?? '', /set `runner\.patterns\.seatBinding\.schema` to 2/);
  } finally {
    process.env.HOME = saved.HOME;
    if (saved.USERPROFILE !== undefined) process.env.USERPROFILE = saved.USERPROFILE;
    else delete process.env.USERPROFILE;
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test('doctor check runner-patterns-config: a global catalog entry warns', () => {
  const home = mkTempDir();
  const repo = mkTempDir();
  const saved = { HOME: process.env.HOME, USERPROFILE: process.env.USERPROFILE };
  process.env.HOME = home;
  process.env.USERPROFILE = home;
  try {
    writeGlobalConfig(home, {
      runner: {
        patterns: {
          'global-solo': {
            loop: 'solo',
            promise: 'global promise',
          },
        },
      },
    });
    const check = DOCTOR_CHECKS.find((c) => c.id === 'runner-patterns-config');
    const res = check.check(repo);
    assert.equal(res.passed, true);
    assert.match(res.message, /^warning:/);
    assert.match(res.message, /global.*refuse|older release/i);
  } finally {
    process.env.HOME = saved.HOME;
    if (saved.USERPROFILE !== undefined) process.env.USERPROFILE = saved.USERPROFILE;
    else delete process.env.USERPROFILE;
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(repo, { recursive: true, force: true });
  }
});
test('doctor check runner-patterns-config: retired pattern key fails with retired advice and custom patterns named loop and loops are accepted', () => {
  const tmpDir = mkTempDir();
  const check = DOCTOR_CHECKS.find((c) => c.id === 'runner-patterns-config');
  writeProjectConfig(tmpDir, {
    runner: {
      patterns: {
        'research-fan-out-gated': {
          loop: 'panel',
          promise: 'old gated',
        },
      },
    },
  });
  const res = check.check(tmpDir);
  assert.equal(res.passed, false);
  assert.match(res.message, /runner\.patterns\.research-fan-out/);

  writeProjectConfig(tmpDir, {
    runner: {
      patterns: {
        loop: { loop: 'solo', promise: 'pattern named loop' },
        loops: { loop: 'solo', promise: 'pattern named loops' },
      },
    },
  });
  const resValid = check.check(tmpDir);
  assert.equal(resValid.passed, true);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('doctor check runner-patterns-config: an explicit code:* minCheckers [reviewer] informs', () => {
  const tmpDir = mkTempDir();
  const check = DOCTOR_CHECKS.find((c) => c.id === 'runner-patterns-config');
  writeProjectConfig(tmpDir, {
    runner: {
      capabilities: {
        'code:implement': {
          minCheckers: ['reviewer'],
        },
      },
    },
  });
  const res = check.check(tmpDir);
  assert.equal(res.passed, true);
  assert.match(res.message, /^info:/);
  assert.match(res.message, /red-team/);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('doctor check runner-patterns-config: two identical-meaning patterns hint', () => {
  const tmpDir = mkTempDir();
  const check = DOCTOR_CHECKS.find((c) => c.id === 'runner-patterns-config');
  writeProjectConfig(tmpDir, {
    runner: {
      patterns: {
        'pat-one': {
          loop: 'solo',
          promise: 'first promise',
        },
        'pat-two': {
          loop: 'solo',
          promise: 'second promise',
        },
      },
    },
  });
  const res = check.check(tmpDir);
  assert.equal(res.passed, true);
  assert.match(res.message, /identical/i);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
test('the mailbox check is enabled by default, passes as not enabled once the project opts out, and names the opt-out', () => {
  const check = DOCTOR_CHECKS.find((c) => c.id === 'mailbox-hook');
  assert.ok(check, 'a mailbox check is registered');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-mailbox-check-'));
  try {
    const absent = check.check(temp);
    assert.equal(absent.passed, true);
    assert.match(absent.message, /^enabled/);
    fs.mkdirSync(path.join(temp, '.fgos'));
    writeProjectConfig(temp, { mailbox: { enabled: false } });
    const off = check.check(temp);
    assert.match(off.message, /not enabled/);
    assert.match(off.message, /mailbox\.enabled/);
    writeProjectConfig(temp, { mailbox: { enabled: true } });
    const on = check.check(temp);
    assert.equal(on.passed, true);
    assert.match(on.message, /^enabled/);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test('the mailbox-hook doctor row reports the record verdict from fgos mailbox status, passes with no record yet, and writes nothing', async () => {
  const { ensureHostBin, REPO_ROOT } = await import('../../scripts/lib/git-addon-stage.mjs');
  const host = ensureHostBin(process.env, REPO_ROOT);
  const check = DOCTOR_CHECKS.find((c) => c.id === 'mailbox-hook');
  const temp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-mailbox-doctor-')));
  const project = path.join(temp, 'project');
  const record = path.join(project, '.fgos', 'runtime', 'mailbox', 'record');
  const before = process.env.FGOS_HOST_BIN;
  process.env.FGOS_HOST_BIN = host;
  try {
    execFileSync('git', ['init', '-q', project]);
    fs.mkdirSync(path.join(project, '.fgos'));
    writeProjectConfig(project, { mailbox: { enabled: true } });

    const none = check.check(project);
    assert.equal(none.passed, true, none.message);
    assert.match(none.message, /record: none yet/);
    assert.equal(fs.existsSync(path.join(project, '.fgos', 'runtime')), false, 'the check created nothing');

    // A refused send opens the record and counts the refusal.
    const sent = spawnSync(host, ['mailbox', 'send', '--to', 'nobody', 'hi'], { cwd: project, env: { ...process.env, FGOS_SESSION_ID: 'doctor-test' }, encoding: 'utf8' });
    assert.equal(sent.status, 1, sent.stdout + sent.stderr);
    const snapshot = fs.readFileSync(path.join(record, 'snapshot.json'));
    const ok = check.check(project);
    assert.equal(ok.passed, true, ok.message);
    assert.match(ok.message, /record: ok \(0 head\(s\), 0 pending\)/);
    assert.deepEqual(fs.readFileSync(path.join(record, 'snapshot.json')), snapshot, 'the check wrote nothing');

    fs.chmodSync(record, 0o777);
    const broken = check.check(project);
    assert.equal(broken.passed, false);
    assert.match(broken.message, /record cannot be read: record-dir-untrusted/);
  } finally {
    if (before === undefined) delete process.env.FGOS_HOST_BIN;
    else process.env.FGOS_HOST_BIN = before;
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
