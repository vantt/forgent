// test/runner/operation-prompt-templates.test.mjs — comprehensive tests for
// operation prompt template registry, resolver, bounded rendering, and provenance (Unit I04 / Phase 3)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

import {
  discoverOperationPromptTemplates,
  loadOperationPromptTemplate,
  validateOperationPromptTemplate,
  renderOperationPromptTemplate,
  resolveAndRenderOperationPrompt,
  TemplateResolutionError,
  BOUNDED_TEMPLATE_VARIABLES,
  PACKAGE_ROOT,
} from '../../src/runner/dispatch/operation-prompt-templates.mjs';

import {
  renderAssignmentPrompt,
  buildAssignment,
} from '../../src/runner/dispatch/assignment.mjs';

import {
  buildEffectiveExecutionContract,
  validateEffectiveExecutionContract,
} from '../../src/runner/dispatch/effective-execution-contract.mjs';

import { executeAssignment } from '../../src/runner/dispatch/assignment-runner.mjs';
import { loadCoordinationProtocol } from '../../src/runner/definitions/protocol-loader.mjs';
import { DOCTOR_CHECKS } from '../../src/setup/checks.mjs';

function createTempDir(prefix = 'fgos-template-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('discoverOperationPromptTemplates discovers shipped core templates cleanly', () => {
  const entries = discoverOperationPromptTemplates();
  assert.ok(entries.length >= 3, `expected at least 3 shipped core templates, got ${entries.length}`);

  const ids = entries.map((e) => e.id);
  assert.ok(ids.includes('master-loop-review-candidate'), 'master-loop-review-candidate must be discovered');
  assert.ok(ids.includes('architecture-advisory-panel-v1-scout-report'), 'architecture-advisory-panel-v1-scout-report must be discovered');
  assert.ok(ids.includes('rfc-review-lite-propose'), 'rfc-review-lite-propose must be discovered');

  for (const entry of entries) {
    assert.equal(typeof entry.id, 'string');
    assert.equal(typeof entry.tier, 'string');
    assert.equal(typeof entry.content, 'string');
    assert.ok(entry.contentDigest.startsWith('sha256:'));
  }
});

test('discoverOperationPromptTemplates is deterministic across repeated runs', () => {
  const run1 = discoverOperationPromptTemplates();
  const run2 = discoverOperationPromptTemplates();
  assert.deepEqual(run1, run2);
});

test('precedence: project tier overrides domain and core tiers', () => {
  const tmpDir = createTempDir();
  try {
    const projectTemplatesDir = path.join(tmpDir, '.fgos', 'prompt-templates');
    fs.mkdirSync(projectTemplatesDir, { recursive: true });

    // Override the core template master-loop-review-candidate
    const customContent = '# Custom Review Candidate\nRole: {role}\nObjective: {objective}\n';
    fs.writeFileSync(path.join(projectTemplatesDir, 'master-loop-review-candidate.md'), customContent);

    const loaded = loadOperationPromptTemplate('master-loop-review-candidate', { cwd: tmpDir });
    assert.equal(loaded.tier, 'project');
    assert.equal(loaded.content, customContent);
    assert.equal(loaded.source, 'project');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('precedence: domain tier overrides core tier when project is absent', () => {
  const tmpPkg = createTempDir('fgos-pkg-test-');
  try {
    const coreDir = path.join(tmpPkg, 'core', 'prompt-templates');
    const domainDir = path.join(tmpPkg, 'domains', 'coding', 'prompt-templates');
    fs.mkdirSync(coreDir, { recursive: true });
    fs.mkdirSync(domainDir, { recursive: true });

    fs.writeFileSync(path.join(coreDir, 'test-op.md'), 'Core: {objective}');
    fs.writeFileSync(path.join(domainDir, 'test-op.md'), 'Domain: {objective}');

    const loaded = loadOperationPromptTemplate('test-op', {
      cwd: '/nonexistent',
      packageRoot: tmpPkg,
      domain: 'coding',
    });
    assert.equal(loaded.tier, 'domain');
    assert.equal(loaded.content, 'Domain: {objective}');
    assert.equal(loaded.source, 'domain:coding');
  } finally {
    fs.rmSync(tmpPkg, { recursive: true, force: true });
  }
});

test('missing template throws template-not-found', () => {
  assert.throws(
    () => loadOperationPromptTemplate('completely-nonexistent-template-id-xyz'),
    (err) => {
      assert.ok(err instanceof TemplateResolutionError);
      assert.equal(err.code, 'template-not-found');
      return true;
    },
  );
});

test('duplicate template in same directory with different extensions throws template-ambiguous', () => {
  const tmpDir = createTempDir();
  try {
    const projectTemplatesDir = path.join(tmpDir, '.fgos', 'prompt-templates');
    fs.mkdirSync(projectTemplatesDir, { recursive: true });

    fs.writeFileSync(path.join(projectTemplatesDir, 'ambiguous-op.md'), 'MD: {objective}');
    fs.writeFileSync(path.join(projectTemplatesDir, 'ambiguous-op.txt'), 'TXT: {objective}');

    assert.throws(
      () => discoverOperationPromptTemplates({ cwd: tmpDir }),
      (err) => {
        assert.ok(err instanceof TemplateResolutionError);
        assert.equal(err.code, 'template-ambiguous');
        assert.match(err.message, /ambiguous-op/);
        return true;
      },
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('colliding template IDs across different domains throws template-ambiguous', () => {
  const tmpPkg = createTempDir('fgos-pkg-dup-');
  try {
    const domainADir = path.join(tmpPkg, 'domains', 'domainA', 'prompt-templates');
    const domainBDir = path.join(tmpPkg, 'domains', 'domainB', 'prompt-templates');
    fs.mkdirSync(domainADir, { recursive: true });
    fs.mkdirSync(domainBDir, { recursive: true });

    fs.writeFileSync(path.join(domainADir, 'shared-id.md'), 'A: {objective}');
    fs.writeFileSync(path.join(domainBDir, 'shared-id.md'), 'B: {objective}');

    assert.throws(
      () => discoverOperationPromptTemplates({ cwd: '/nonexistent', packageRoot: tmpPkg }),
      (err) => {
        assert.ok(err instanceof TemplateResolutionError);
        assert.equal(err.code, 'template-ambiguous');
        assert.match(err.message, /shared-id/);
        return true;
      },
    );
  } finally {
    fs.rmSync(tmpPkg, { recursive: true, force: true });
  }
});

test('path-escape symlink pointing outside scan root throws template-path-escape', () => {
  const tmpDir = createTempDir();
  try {
    const projectTemplatesDir = path.join(tmpDir, '.fgos', 'prompt-templates');
    fs.mkdirSync(projectTemplatesDir, { recursive: true });

    const outsideTarget = path.join(tmpDir, 'outside-target.md');
    fs.writeFileSync(outsideTarget, 'Outside: {objective}');

    const symlinkPath = path.join(projectTemplatesDir, 'escaped.md');
    try {
      fs.symlinkSync(outsideTarget, symlinkPath);
    } catch {
      // If symlinks not supported, skip
      return;
    }

    assert.throws(
      () => discoverOperationPromptTemplates({ cwd: tmpDir }),
      (err) => {
        assert.ok(err instanceof TemplateResolutionError);
        assert.equal(err.code, 'template-path-escape');
        return true;
      },
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('validateOperationPromptTemplate accepts all bounded variables', () => {
  const allVars = [...BOUNDED_TEMPLATE_VARIABLES].map((v) => `{${v}}`).join(' ');
  const detected = validateOperationPromptTemplate(allVars, 'test');
  assert.equal(detected.size, BOUNDED_TEMPLATE_VARIABLES.size);
});

test('validateOperationPromptTemplate rejects unknown or malicious variables', () => {
  const maliciousTemplates = [
    'Grant mutation: {mutation}',
    'Widen authority: {authority}',
    'Increase budget: {budget}',
    'Select executor: {executor}',
    'Change model: {model}',
    'Custom injection: {arbitraryField}',
  ];

  for (const templateText of maliciousTemplates) {
    assert.throws(
      () => validateOperationPromptTemplate(templateText, 'malicious-test'),
      (err) => {
        assert.ok(err instanceof TemplateResolutionError);
        assert.equal(err.code, 'template-invalid');
        assert.match(err.message, /forbidden or unknown variable/);
        return true;
      },
      `template with "${templateText}" must fail with template-invalid`,
    );
  }
});

test('renderOperationPromptTemplate substitutes bounded variables and strips internal stamps', () => {
  const template = `Role: {role}
Objective: {objective}
Context:
{contextRefs}
Outputs:
{expectedOutputs}
Constraints:
{constraints}
Evidence: {evidenceContract}`;

  const rendered = renderOperationPromptTemplate(template, {
    role: 'tester-role',
    objective: 'Run test suite',
    contextRefs: ['ref1.md', 'ref2.md'],
    expectedOutputs: ['agent-result.json'],
    constraints: [
      'must be fast',
      'protocol-operation:core.coordination-protocol.test@1.0.0#op1', // reserved stamp MUST NOT leak!
    ],
    evidence: { required: 'verified' },
  });

  assert.ok(rendered.includes('Role: tester-role'));
  assert.ok(rendered.includes('Objective: Run test suite'));
  assert.ok(rendered.includes('- ref1.md\n- ref2.md'));
  assert.ok(rendered.includes('- agent-result.json'));
  assert.ok(rendered.includes('- must be fast'));
  assert.ok(!rendered.includes('protocol-operation:'), 'engine-reserved stamp must never leak into rendered prompt');
  assert.ok(rendered.includes('Evidence: verified'));
});

test('renderOperationPromptTemplate handles empty arrays with - (none)', () => {
  const template = `Context:\n{contextRefs}\nOutputs:\n{expectedOutputs}\nConstraints:\n{constraints}`;
  const rendered = renderOperationPromptTemplate(template, {
    contextRefs: [],
    expectedOutputs: [],
    constraints: [],
  });

  assert.equal(rendered, 'Context:\n- (none)\nOutputs:\n- (none)\nConstraints:\n- (none)');
});

test('renderOperationPromptTemplate supports {artifactRefs} alias for {contextRefs}', () => {
  const template = `Artifacts:\n{artifactRefs}`;
  const rendered = renderOperationPromptTemplate(template, {
    contextRefs: ['artifact-1.json', 'artifact-2.md'],
  });
  assert.equal(rendered, 'Artifacts:\n- artifact-1.json\n- artifact-2.md');
});

test('resolveAndRenderOperationPrompt produces rendered body and complete template provenance', () => {
  const assignment = {
    assignmentId: 'asgn_test_1',
    role: 'reviewer',
    objective: 'Review the candidate changes',
    contractTemplate: 'master-loop-review-candidate',
    contextRefs: ['plans/test/plan.md'],
    expectedOutputs: ['agent-result.json', 'agent-report.md'],
    constraints: ['read-only'],
    evidence: { required: 'reported' },
  };

  const { renderedBody, templateProvenance } = resolveAndRenderOperationPrompt(assignment);
  assert.ok(renderedBody.includes('Review the candidate changes'));
  assert.ok(renderedBody.includes('- plans/test/plan.md'));
  assert.ok(renderedBody.includes('- agent-result.json'));

  assert.equal(templateProvenance.id, 'master-loop-review-candidate');
  assert.equal(templateProvenance.tier, 'core');
  assert.ok(templateProvenance.contentDigest.startsWith('sha256:'));
  assert.ok(templateProvenance.renderedPromptDigest.startsWith('sha256:'));
  assert.equal(typeof templateProvenance.templateSnapshot, 'string');
  assert.ok(templateProvenance.templateSnapshot.length > 0);

  // Digest matches sha256 of templateSnapshot
  const computedHash = `sha256:${crypto.createHash('sha256').update(templateProvenance.templateSnapshot).digest('hex')}`;
  assert.equal(computedHash, templateProvenance.contentDigest);
});

test('renderAssignmentPrompt uses contractTemplate when declared', () => {
  const assignment = {
    assignmentId: 'asgn_tmpl_render_1',
    workId: 'work-123',
    role: 'reviewer',
    objective: 'Review candidate diff',
    contractTemplate: 'master-loop-review-candidate',
    contextRefs: ['file1.js'],
    expectedOutputs: ['agent-result.json'],
    constraints: [],
  };

  const prompt = renderAssignmentPrompt(assignment);
  assert.ok(prompt.startsWith('Assignment: asgn_tmpl_render_1'));
  assert.ok(prompt.includes('Work: work-123'));
  assert.ok(prompt.includes('# Candidate Review (Master Coordination Loop)'));
  assert.ok(prompt.includes('Review candidate diff'));
  assert.ok(prompt.includes('- file1.js'));
  // Should NOT contain legacy "Task-spec: domains/coding/..." or duplicate legacy header
  assert.ok(!prompt.includes('Task-spec: domains/coding'));
});

test('renderAssignmentPrompt preserves explicit legacy objective path when contractTemplate is omitted', () => {
  const legacyAssignment = {
    assignmentId: 'asgn_legacy_1',
    workId: 'work-legacy',
    role: 'implementer',
    objective: 'Fix legacy bug without template',
    contextRefs: ['ref.md'],
    expectedOutputs: ['out.json'],
    constraints: [],
  };

  const prompt = renderAssignmentPrompt(legacyAssignment);
  assert.ok(prompt.includes('Assignment: asgn_legacy_1'));
  assert.ok(prompt.includes('Work: work-legacy'));
  assert.ok(prompt.includes('Role: implementer'));
  assert.ok(prompt.includes('Objective: Fix legacy bug without template'));
  assert.ok(prompt.includes('Context refs:'));
  assert.ok(prompt.includes('- ref.md'));
  assert.ok(prompt.includes('Expected outputs:'));
  assert.ok(prompt.includes('- out.json'));
});

test('renderAssignmentPrompt fails loudly on missing template', () => {
  const badAssignment = {
    assignmentId: 'asgn_bad_tmpl',
    contractTemplate: 'non-existent-template-id-999',
    objective: 'test',
    role: 'test',
  };

  assert.throws(
    () => renderAssignmentPrompt(badAssignment),
    (err) => {
      assert.ok(err instanceof TemplateResolutionError);
      assert.equal(err.code, 'template-not-found');
      return true;
    },
  );
});

test('buildEffectiveExecutionContract attaches template provenance without secrets', () => {
  const templateProvenance = {
    id: 'master-loop-review-candidate',
    tier: 'core',
    source: 'core',
    filePath: 'core/prompt-templates/master-loop-review-candidate.md',
    contentDigest: 'sha256:abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234',
    renderedPromptDigest: 'sha256:5678ef015678ef015678ef015678ef015678ef015678ef015678ef015678ef01',
    templateSnapshot: '# Snapshot',
  };

  const contract = buildEffectiveExecutionContract({
    assignment: {
      assignmentId: 'asgn_eff_1',
      mutation: 'read-only',
      budget: { timeoutMs: 10000 },
      provenance: {
        template: templateProvenance,
      },
    },
    dispatchPlan: {
      mechanism: 'out-of-process',
      executorId: 'claude',
      invocation: { adapter: 'cli-spawn', cwd: process.cwd() },
    },
    runId: 'run_eff_1',
    runDir: '/tmp',
    cwd: process.cwd(),
    executorId: 'claude',
    adapter: 'cli-spawn',
    templateProvenance,
  });

  assert.deepEqual(contract.provenance.template, templateProvenance);
  validateEffectiveExecutionContract(contract);
});

test('domain-neutral proof: 1 plan-loop + 2 advisory operations resolve via identical mechanism', () => {
  // 1. Plan-loop operation: review-candidate from standalone-master-coordination-loop
  const masterLoopDef = loadCoordinationProtocol('core.coordination-protocol.standalone-master-coordination-loop');
  const reviewOp = masterLoopDef.spec.operations.find((o) => o.id === 'review-candidate');
  assert.ok(reviewOp, 'review-candidate operation must exist');
  assert.equal(reviewOp.task?.contractTemplate, 'master-loop-review-candidate');

  const loadedPlanLoop = loadOperationPromptTemplate(reviewOp.task.contractTemplate);
  assert.equal(loadedPlanLoop.id, 'master-loop-review-candidate');
  assert.equal(loadedPlanLoop.tier, 'core');

  // 2. Advisory operation 1: investigate-context from architecture-advisory-panel-v1
  const archPanelDef = loadCoordinationProtocol('core.coordination-protocol.architecture-advisory-panel-v1');
  const scoutOp = archPanelDef.spec.operations.find((o) => o.id === 'investigate-context');
  assert.ok(scoutOp, 'investigate-context operation must exist');
  assert.equal(scoutOp.task?.contractTemplate, 'architecture-advisory-panel-v1-scout-report');

  const loadedAdvisory1 = loadOperationPromptTemplate(scoutOp.task.contractTemplate);
  assert.equal(loadedAdvisory1.id, 'architecture-advisory-panel-v1-scout-report');
  assert.equal(loadedAdvisory1.tier, 'core');

  // 3. Advisory operation 2: propose from group-thinking-rfc-review-lite
  const rfcDef = loadCoordinationProtocol('core.coordination-protocol.group-thinking-rfc-review-lite');
  const proposeOp = rfcDef.spec.operations.find((o) => o.id === 'propose');
  assert.ok(proposeOp, 'propose operation must exist');
  assert.equal(proposeOp.task?.contractTemplate, 'rfc-review-lite-propose');

  const loadedAdvisory2 = loadOperationPromptTemplate(proposeOp.task.contractTemplate);
  assert.equal(loadedAdvisory2.id, 'rfc-review-lite-propose');
  assert.equal(loadedAdvisory2.tier, 'core');

  // All 3 resolve and render cleanly through the exact same resolveAndRenderOperationPrompt
  const res1 = resolveAndRenderOperationPrompt({
    assignmentId: 'asgn_p1',
    role: reviewOp.role,
    objective: 'Audit code candidate',
    contractTemplate: reviewOp.task.contractTemplate,
  });
  const res2 = resolveAndRenderOperationPrompt({
    assignmentId: 'asgn_p2',
    role: scoutOp.role,
    objective: 'Investigate architecture facts',
    contractTemplate: scoutOp.task.contractTemplate,
  });
  const res3 = resolveAndRenderOperationPrompt({
    assignmentId: 'asgn_p3',
    role: proposeOp.role,
    objective: 'Formulate initial RFC proposal',
    contractTemplate: proposeOp.task.contractTemplate,
  });

  assert.ok(res1.renderedBody.length > 0);
  assert.ok(res2.renderedBody.length > 0);
  assert.ok(res3.renderedBody.length > 0);
  assert.ok(res1.templateProvenance.contentDigest.startsWith('sha256:'));
  assert.ok(res2.templateProvenance.contentDigest.startsWith('sha256:'));
  assert.ok(res3.templateProvenance.contentDigest.startsWith('sha256:'));
});

test('retry/replay attribution stability: snapshot and digests remain deterministic when disk template changes', () => {
  const tmpDir = createTempDir('fgos-replay-test-');
  try {
    const projectTemplatesDir = path.join(tmpDir, '.fgos', 'prompt-templates');
    fs.mkdirSync(projectTemplatesDir, { recursive: true });

    const originalContent = '# Original Template\nRole: {role}\nObjective: {objective}\n';
    const templateFilePath = path.join(projectTemplatesDir, 'replay-stable-op.md');
    fs.writeFileSync(templateFilePath, originalContent);

    const assignment = {
      assignmentId: 'asgn_replay_test',
      role: 'reviewer',
      objective: 'Verify replay stability',
      contractTemplate: 'replay-stable-op',
    };

    // First resolution (dispatch time)
    const run1Resolution = resolveAndRenderOperationPrompt(assignment, { cwd: tmpDir });
    const originalContentDigest = run1Resolution.templateProvenance.contentDigest;
    const originalRenderedDigest = run1Resolution.templateProvenance.renderedPromptDigest;
    const originalSnapshot = run1Resolution.templateProvenance.templateSnapshot;

    // Simulate modifying the template on disk later
    fs.writeFileSync(templateFilePath, '# Modified Template V2\nRole: {role}\nObjective: {objective}\nExtra: static text\n');

    // Run 1's recorded provenance remains attributable and verifiable
    const recomputedOriginalDigest = `sha256:${crypto.createHash('sha256').update(originalSnapshot).digest('hex')}`;
    assert.equal(recomputedOriginalDigest, originalContentDigest, 'pinned snapshot must match original content digest');

    // And rendering against the pinned snapshot reproduces the exact original rendered digest
    const reRendered = renderOperationPromptTemplate(originalSnapshot, {
      role: assignment.role,
      objective: assignment.objective,
    });
    const reRenderedDigest = `sha256:${crypto.createHash('sha256').update(reRendered).digest('hex')}`;
    assert.equal(reRenderedDigest, originalRenderedDigest, 're-rendering pinned snapshot reproduces original rendered prompt digest');

    // Meanwhile, a fresh resolution on the modified template sees the new version
    const run2Resolution = resolveAndRenderOperationPrompt(assignment, { cwd: tmpDir });
    assert.notEqual(run2Resolution.templateProvenance.contentDigest, originalContentDigest, 'new resolution sees new disk digest');
    assert.notEqual(run2Resolution.templateProvenance.renderedPromptDigest, originalRenderedDigest, 'new resolution sees new prompt digest');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('operation-prompt-templates-valid doctor check is registered and passes on repository', () => {
  const check = DOCTOR_CHECKS.find((c) => c.id === 'operation-prompt-templates-valid');
  assert.ok(check, 'operation-prompt-templates-valid must be registered');

  const result = check.check(process.cwd());
  assert.equal(result.passed, true);
  assert.match(result.message, /operation prompt template\(s\) discovered and validated cleanly/);
});

test('operation-prompt-templates-valid doctor check fails when a malformed template is present', () => {
  const check = DOCTOR_CHECKS.find((c) => c.id === 'operation-prompt-templates-valid');
  const tmpDir = createTempDir('fgos-doc-fail-');
  try {
    const projectTemplatesDir = path.join(tmpDir, '.fgos', 'prompt-templates');
    fs.mkdirSync(projectTemplatesDir, { recursive: true });
    // Write a template with forbidden variable
    fs.writeFileSync(path.join(projectTemplatesDir, 'invalid-tmpl.md'), 'Forbidden: {forbiddenVar}');

    const result = check.check(tmpDir);
    assert.equal(result.passed, false);
    assert.match(result.message, /malformed operation prompt template/);
    assert.match(result.message, /forbiddenVar/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('I04-REV-01 regression: renderAssignmentPrompt renders from pinned snapshot when disk template changes or is deleted', () => {
  const tmpDir = createTempDir('fgos-rev01-probe-');
  try {
    const projectTemplatesDir = path.join(tmpDir, '.fgos', 'prompt-templates');
    fs.mkdirSync(projectTemplatesDir, { recursive: true });

    const originalContent = '# Original Template\nRole: {role}\nObjective: {objective}\n';
    const templateFilePath = path.join(projectTemplatesDir, 'probe-op.md');
    fs.writeFileSync(templateFilePath, originalContent);

    const assignment = {
      assignmentId: 'asgn_rev01_probe',
      role: 'reviewer',
      objective: 'Verify probe fix',
      contractTemplate: 'probe-op',
    };

    // First render / resolution
    const firstPrompt = renderAssignmentPrompt(assignment, { cwd: tmpDir });
    assert.match(firstPrompt, /# Original Template/);

    const firstResolution = resolveAndRenderOperationPrompt(assignment, { cwd: tmpDir });
    const assignmentWithPinned = {
      ...assignment,
      provenance: {
        template: firstResolution.templateProvenance,
      },
    };

    // Modify template on disk
    fs.writeFileSync(templateFilePath, '# Modified Template V2\nRole: {role}\nObjective: {objective}\n');

    // Second render using assignment with pinned snapshot
    const secondPrompt = renderAssignmentPrompt(assignmentWithPinned, { cwd: tmpDir });
    const secondUsesChanged = secondPrompt.includes('# Modified Template V2');
    const secondUsesSnapshot = secondPrompt.includes('# Original Template');

    assert.equal(secondUsesChanged, false, 'second render must not use changed disk template');
    assert.equal(secondUsesSnapshot, true, 'second render must use pinned snapshot');

    // Delete template from disk entirely
    fs.unlinkSync(templateFilePath);

    // Third render using pinned snapshot must still succeed
    const thirdPrompt = renderAssignmentPrompt(assignmentWithPinned, { cwd: tmpDir });
    assert.match(thirdPrompt, /# Original Template/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('I04-REV-01 regression: executeAssignment retry uses pinned template snapshot when disk template changes or is deleted', async () => {
  const tmpDir = createTempDir('fgos-rev01-runner-');
  try {
    const projectTemplatesDir = path.join(tmpDir, '.fgos', 'prompt-templates');
    fs.mkdirSync(projectTemplatesDir, { recursive: true });

    const originalContent = '# Pinned Dispatch Template\nRole: {role}\nObjective: {objective}\n';
    const templateFilePath = path.join(projectTemplatesDir, 'runner-retry-op.md');
    fs.writeFileSync(templateFilePath, originalContent);

    const argvLog = path.join(tmpDir, 'argv-log.jsonl');
    const executorScript = path.join(tmpDir, 'mock-executor.mjs');
    fs.writeFileSync(
      executorScript,
      `
      import fs from 'node:fs';
      import path from 'node:path';
      const prompt = process.argv.slice(2).join(' ');
      fs.appendFileSync(${JSON.stringify(argvLog)}, JSON.stringify({ prompt }) + '\\n');
      const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
      if (match) {
        const runDir = path.dirname(match[1]);
        fs.mkdirSync(runDir, { recursive: true });
        fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nAssignment execution completed successfully with full substantive report content.\\n');
        fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done' }));
      }
      process.exit(0);
      `,
    );

    const runnerConfig = {
      executor: {
        allowCrossProvider: true,
        command: process.execPath,
        args: [executorScript, '{prompt}'],
      },
      models: { standard: 'test-model' },
      timeoutMs: 5000,
    };

    const assignment = {
      assignmentId: 'asgn_rev01_runner',
      domain: 'coding',
      workflow: 'test-wf',
      stage: 'planning',
      operation: 'validate-plan',
      contractTemplate: 'runner-retry-op',
      role: 'tester',
      objective: 'Test runner retry snapshot retention',
      mutation: 'read-only',
    };

    // First execution
    const run1 = await executeAssignment(assignment, {
      cwd: tmpDir,
      repoRoot: tmpDir,
      runnerConfig,
    });
    assert.equal(run1.status, 'done');

    // Verify assignment.json on disk now carries template provenance with templateSnapshot
    const assignmentJsonPath = path.join(tmpDir, '.fgos', 'assignments', assignment.assignmentId, 'assignment.json');
    assert.ok(fs.existsSync(assignmentJsonPath));
    const persistedAssignment = JSON.parse(fs.readFileSync(assignmentJsonPath, 'utf8'));
    assert.ok(persistedAssignment.provenance?.template?.templateSnapshot);
    const originalContentDigest = persistedAssignment.provenance.template.contentDigest;
    assert.equal(persistedAssignment.provenance.template.templateSnapshot, originalContent);

    // Modify disk template
    fs.writeFileSync(templateFilePath, '# Modified V2 Template\nRole: {role}\nObjective: {objective}\n');

    // Second execution (retry / second run on same assignment)
    const run2 = await executeAssignment(assignment, {
      cwd: tmpDir,
      repoRoot: tmpDir,
      runnerConfig,
    });
    assert.equal(run2.status, 'done');

    // Delete disk template entirely
    fs.unlinkSync(templateFilePath);

    // Third execution (third run on same assignment, template file gone)
    const run3 = await executeAssignment(assignment, {
      cwd: tmpDir,
      repoRoot: tmpDir,
      runnerConfig,
    });
    assert.equal(run3.status, 'done');

    // Read recorded prompts from argvLog
    const logLines = fs.readFileSync(argvLog, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    assert.equal(logLines.length, 3);
    for (let i = 0; i < 3; i++) {
      assert.ok(logLines[i].prompt.includes('# Pinned Dispatch Template'), `run ${i + 1} must use original pinned template`);
      assert.ok(!logLines[i].prompt.includes('# Modified V2 Template'), `run ${i + 1} must not use modified template`);
    }

    // Check effective contract of run 02 and 03
    const run2ContractPath = path.join(tmpDir, '.fgos', 'assignments', assignment.assignmentId, 'runs', '02', 'effective-execution-contract.json');
    const run2Contract = JSON.parse(fs.readFileSync(run2ContractPath, 'utf8'));
    assert.equal(run2Contract.provenance.template.contentDigest, originalContentDigest);
    assert.equal(run2Contract.provenance.template.templateSnapshot, originalContent);

    const run3ContractPath = path.join(tmpDir, '.fgos', 'assignments', assignment.assignmentId, 'runs', '03', 'effective-execution-contract.json');
    const run3Contract = JSON.parse(fs.readFileSync(run3ContractPath, 'utf8'));
    assert.equal(run3Contract.provenance.template.contentDigest, originalContentDigest);
    assert.equal(run3Contract.provenance.template.templateSnapshot, originalContent);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
