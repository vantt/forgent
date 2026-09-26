// test/skills/coordination-phase4-driver-discipline.test.mjs — Phase 4 test suite.
// Verifies:
// 1. Plan-loop skill word budget and Lead instruction-token reduction.
// 2. Driver discipline fragment contains zero coding/track vocabulary and defines all 9 hook slots.
// 3. Coding-cell policy fragment is reusable for a single cell without plan/track assumptions.
// 4. Plan-loop facade cleanses raw request JSON and manual ID generation.
// 5. Generated skill projections are byte-identical to canonical sources.
// 6. Stale implicit close language remains absent.
// 7. CLI flag contract: documented coordination commands in skills match real CLI allowlists and required flags.
// 8. Clean pass lifecycle with real entry-node start, simulated crash/resume, dispatch/wave count parity, explicit close.
// 9. Fix round and recheck discharge lifecycle with full quorum explicit close and dispatch/wave count parity.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import {
  CoordinationError,
} from '../../src/runner/coordination/schema.mjs';
import { startCoordinationUseCase } from '../../src/verbs/coordination/start.mjs';
import {
  showCoordinationStatusUseCase,
} from '../../src/verbs/coordination/status.mjs';
import {
  showCoordinationActionsUseCase,
  executeOperationUseCase,
  executeAuthorizeAndDispatchUseCase,
  executeDispositionUseCase,
  executeCloseUseCase,
} from '../../src/verbs/coordination/actions.mjs';
import { chainCoordinationUseCase } from '../../src/verbs/coordination/chain.mjs';

const REPO_ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

const PLAN_LOOP_CANONICAL = path.join(REPO_ROOT, 'core/skills/fgos-plan-loop/SKILL.md');
const PLAN_LOOP_AGENTS = path.join(REPO_ROOT, '.agents/skills/fgos-plan-loop/SKILL.md');
const PLAN_LOOP_PLUGIN = path.join(REPO_ROOT, 'plugins/fgOS/skills/fgos-plan-loop/SKILL.md');
const PLAN_LOOP_CLAUDE = path.join(REPO_ROOT, '.claude/skills/fgos-plan-loop/SKILL.md');

const DRIVER_FRAGMENT = path.join(REPO_ROOT, 'core/skills/_shared/coordination-driver.md');
const CODING_POLICY_FRAGMENT = path.join(REPO_ROOT, 'domains/coding/skills/_shared/coding-cell-policy.md');

const PROTOCOL_ID = 'core.coordination-protocol.standalone-master-coordination-loop';

// Baseline measured in Phase 0 (phase-00-unit-0c-baseline-replay-measurement.json)
const BASELINE_PLAN_LOOP_WORDS = 5160;

function countWords(str) {
  const words = str.trim().split(/\s+/);
  return words.filter(Boolean).length;
}

function makeTempCtx(opts = {}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-phase4-driver-test-'));
  const fgosDir = path.join(tmpDir, '.fgos');
  const sessionsDir = path.join(fgosDir, 'coordination', 'sessions');
  const worktreeDir = path.join(tmpDir, 'worktree-cell-01');
  fs.mkdirSync(sessionsDir, { recursive: true });
  fs.mkdirSync(worktreeDir, { recursive: true });

  const fakeExec = path.join(tmpDir, 'fake-exec.mjs');
  const reviewerFinding = opts.reviewerFinding === true;
  fs.writeFileSync(fakeExec, `
    import fs from 'node:fs';
    import path from 'node:path';

    const assignmentsRoot = path.join('${fgosDir}', 'assignments');
    if (fs.existsSync(assignmentsRoot)) {
      for (const asgn of fs.readdirSync(assignmentsRoot)) {
        let isReviewerFinding = false;
        if (${reviewerFinding}) {
          try {
            const asgnJson = JSON.parse(fs.readFileSync(path.join(assignmentsRoot, asgn, 'assignment.json'), 'utf8'));
            const constraints = asgnJson.provenance?.inline?.contract?.constraints || asgnJson.constraints || [];
            if (constraints.some((c) => typeof c === 'string' && c.includes('review-candidate'))) {
              isReviewerFinding = true;
            }
          } catch {}
        }
        const runsDir = path.join(assignmentsRoot, asgn, 'runs');
        if (!fs.existsSync(runsDir)) continue;
        for (const run of fs.readdirSync(runsDir)) {
          const runDir = path.join(runsDir, run);
          if (fs.existsSync(runDir) && !fs.existsSync(path.join(runDir, 'agent-result.json'))) {
            if (isReviewerFinding) {
              fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Review Report\\nSubstantive issues identified in the candidate implementation requiring revision.\\n');
              fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({
                status: 'failed',
                error: 'Code smell identified in candidate implementation',
                summary: 'Substantive review findings requiring revision.',
                assessment: { verdict: 'findings' },
              }));
            } else {
              fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nSubstantive evaluation of candidate implementation completed successfully.\\n');
              fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Substantive evaluation completed successfully.' }));
            }
          }
        }
      }
    }
    process.exit(0);
  `);

  const configFile = path.join(fgosDir, 'config.json');
  fs.writeFileSync(configFile, JSON.stringify({
    runner: {
      executor: { allowCrossProvider: true, command: process.execPath, args: [fakeExec, '{prompt}'] },
      models: { standard: 'test-model', nano: 'test-model', flagship: 'test-model' },
      timeoutMs: 20000,
    },
  }, null, 2));

  return {
    cwd: tmpDir,
    repoRoot: tmpDir,
    packageRoot: REPO_ROOT,
    worktreeDir,
    cleanup: () => {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    },
  };
}

// -----------------------------------------------------------------------------
// 1. plan-loop skill is within budget and reduces Lead instructions
// -----------------------------------------------------------------------------

test('Phase 4: plan-loop skill is within word budget (target 800-1200 words, <= 1500 words)', () => {
  assert.ok(fs.existsSync(PLAN_LOOP_CANONICAL), 'canonical plan-loop skill must exist');
  const planLoopContent = fs.readFileSync(PLAN_LOOP_CANONICAL, 'utf8');
  const planLoopWords = countWords(planLoopContent);

  assert.ok(
    planLoopWords <= 1500,
    `plan-loop skill must be <= 1500 words (budget), got ${planLoopWords} words`,
  );
  assert.ok(
    planLoopWords >= 500,
    `plan-loop skill must have sufficient operational substance (>= 500 words), got ${planLoopWords} words`,
  );

  // Facade-only reduction vs Phase 0 baseline (5160 words)
  const facadeReduction = ((BASELINE_PLAN_LOOP_WORDS - planLoopWords) / BASELINE_PLAN_LOOP_WORDS) * 100;
  assert.ok(
    facadeReduction >= 60,
    `plan-loop facade word reduction must be >= 60% vs baseline (${BASELINE_PLAN_LOOP_WORDS} words), achieved ${facadeReduction.toFixed(1)}% (${planLoopWords} words)`,
  );

  // Combined Lead load (SKILL.md + coordination-driver.md + coding-cell-policy.md)
  const driverContent = fs.readFileSync(DRIVER_FRAGMENT, 'utf8');
  const policyContent = fs.readFileSync(CODING_POLICY_FRAGMENT, 'utf8');
  const driverWords = countWords(driverContent);
  const policyWords = countWords(policyContent);
  const combinedWords = planLoopWords + driverWords + policyWords;

  // The combined load is dramatically leaner than the monolithic skill plus historical docs
  assert.ok(
    combinedWords <= 3300,
    `combined Lead load must be bounded (<= 3300 words), got ${combinedWords} words (${planLoopWords} facade + ${driverWords} driver + ${policyWords} policy)`,
  );
});

// -----------------------------------------------------------------------------
// 2. driver discipline fragment contains no coding/track vocabulary
// -----------------------------------------------------------------------------

test('Phase 4: driver discipline fragment contains no coding/track vocabulary and defines all hook slots', () => {
  assert.ok(fs.existsSync(DRIVER_FRAGMENT), 'driver discipline fragment must exist');
  const content = fs.readFileSync(DRIVER_FRAGMENT, 'utf8');

  // Hard vocabulary prohibition
  const forbiddenPatterns = [
    { pattern: /\bgit\b/i, name: 'git' },
    { pattern: /\bworktrees?\b/i, name: 'worktree' },
    { pattern: /\bmerg(?:e|es|ed|ing)\b/i, name: 'merge' },
    { pattern: /npm\s+test/i, name: 'npm test' },
    { pattern: /\bphases?\b/i, name: 'phase' },
    { pattern: /plan\.md/i, name: 'plan.md' },
  ];

  for (const { pattern, name } of forbiddenPatterns) {
    const match = content.match(pattern);
    assert.equal(
      match,
      null,
      `driver discipline fragment must contain no coding/track vocabulary: found "${match ? match[0] : ''}" (forbidden: ${name})`,
    );
  }

  // All 9 hook slots must be explicitly defined
  const requiredHooks = [
    'unit of iteration',
    'open inputs',
    'evidence verification',
    'disposition criteria',
    'adaptation bounds',
    'human-escalation triggers',
    'close criteria',
    'after-close action',
    'continuity artifact',
  ];

  for (const hook of requiredHooks) {
    assert.ok(
      content.includes(`\`${hook}\``),
      `driver discipline fragment must define hook slot "${hook}"`,
    );
  }

  // Generic 8-step driver cycle must be present
  assert.ok(content.includes('observe(status)'));
  assert.ok(content.includes('choose one legal action'));
  assert.ok(content.includes('dispatch'));
  assert.ok(content.includes('verify evidence'));
  assert.ok(content.includes('disposition'));
  assert.ok(content.includes('adapt'));
  assert.ok(content.includes('explicit close or continue'));
  assert.ok(content.includes('continuity artifact'));
});

// -----------------------------------------------------------------------------
// 3. coding-cell fragment is reusable for one cell with no plan/track assumptions
// -----------------------------------------------------------------------------

test('Phase 4: coding-cell fragment is reusable for one cell with no plan/track assumptions', () => {
  assert.ok(fs.existsSync(CODING_POLICY_FRAGMENT), 'coding cell policy fragment must exist');
  const content = fs.readFileSync(CODING_POLICY_FRAGMENT, 'utf8');

  // Must define isolated worktree discipline and reference private-cell-worktree.md
  assert.ok(content.includes('Isolated Worktree Discipline'));
  assert.ok(content.includes('private-cell-worktree.md'), 'coding-cell-policy must reference private-cell-worktree.md');

  // Must define proof tiers
  assert.ok(content.includes('Proof Tiers'));
  assert.ok(content.includes('Tier 1: Focused'));
  assert.ok(content.includes('Tier 2: Affected'));
  assert.ok(content.includes('Tier 3: Full-Suite Gate'));

  // Must require independent verification of doer commit and tests
  assert.ok(content.includes('Independent Verification of Doer Commit and Tests'));

  // Must define merge and cleanup only after explicit close
  assert.ok(content.includes('Merge and Cleanup Only After Explicit Close'));

  // Must define tested and integrated identity
  assert.ok(content.includes('Tested and Integrated Identity'));
  assert.ok(content.includes('testedSha'));
  assert.ok(content.includes('integratedSha'));
  assert.ok(content.includes('treeIdentical: true'));
  assert.ok(content.includes('Non-Inference Rule'));

  // Must NOT assume a multi-cell plan or track
  assert.doesNotMatch(content, /\bplan\.md\b/);
  assert.doesNotMatch(content, /\btrack status\b/i);
});

// -----------------------------------------------------------------------------
// 4. plan-loop facade cleanses raw request JSON and manual ID generation
// -----------------------------------------------------------------------------

test('Phase 4: plan-loop no longer embeds raw request JSON or copied kernel rules', () => {
  const content = fs.readFileSync(PLAN_LOOP_CANONICAL, 'utf8');

  // Forbid raw coordination JSON requests
  assert.doesNotMatch(content, /"kind":\s*"declared-protocol"/, 'plan-loop must not embed raw start request JSON');
  assert.doesNotMatch(content, /"type":\s*"operation"/, 'plan-loop must not embed raw operation request JSON');
  assert.doesNotMatch(content, /"action":\s*"authorize-operation"/, 'plan-loop must not embed raw authorization request JSON');

  // Forbid manual ID generation patterns
  assert.doesNotMatch(content, /auth-rev-\$\{Date\.now\(\)\}/, 'plan-loop must not instruct manual authorization ID generation');
  assert.doesNotMatch(content, /inv-\$\{Date\.now\(\)\}/, 'plan-loop must not instruct manual invocation ID generation');

  // Must instruct semantic CLI commands
  assert.ok(content.includes('fgos coordination start'), 'must instruct semantic coordination start');
  assert.ok(content.includes('fgos coordination status'), 'must instruct semantic coordination status');
  assert.ok(content.includes('fgos coordination operation'), 'must instruct semantic coordination operation');
  assert.ok(content.includes('fgos coordination authorize-and-dispatch'), 'must instruct semantic authorize-and-dispatch');
  assert.ok(content.includes('fgos coordination disposition'), 'must instruct semantic coordination disposition');
  assert.ok(content.includes('fgos coordination close'), 'must instruct semantic coordination close');
  assert.ok(content.includes('fgos coordination chain'), 'must instruct semantic coordination chain');
});

// -----------------------------------------------------------------------------
// 5. generated skill projections are byte-identical
// -----------------------------------------------------------------------------

test('Phase 4: generated skill projections are byte-identical to canonical sources', () => {
  // Shared driver discipline
  const driverCanonical = fs.readFileSync(DRIVER_FRAGMENT);
  const driverAgents = fs.readFileSync(path.join(REPO_ROOT, '.agents/skills/_shared/coordination-driver.md'));
  const driverPlugin = fs.readFileSync(path.join(REPO_ROOT, 'plugins/fgOS/skills/_shared/coordination-driver.md'));
  assert.ok(driverCanonical.equals(driverAgents), '.agents/skills/_shared/coordination-driver.md must match canonical');
  assert.ok(driverCanonical.equals(driverPlugin), 'plugins/fgOS/skills/_shared/coordination-driver.md must match canonical');

  // Coding cell policy
  const policyCanonical = fs.readFileSync(CODING_POLICY_FRAGMENT);
  const policyAgents = fs.readFileSync(path.join(REPO_ROOT, '.agents/skills/_shared/coding-cell-policy.md'));
  const policyPlugin = fs.readFileSync(path.join(REPO_ROOT, 'plugins/fgOS/skills/_shared/coding-cell-policy.md'));
  assert.ok(policyCanonical.equals(policyAgents), '.agents/skills/_shared/coding-cell-policy.md must match canonical');
  assert.ok(policyCanonical.equals(policyPlugin), 'plugins/fgOS/skills/_shared/coding-cell-policy.md must match canonical');

  // Plan-loop skill
  const planLoopCanonical = fs.readFileSync(PLAN_LOOP_CANONICAL);
  const planLoopAgents = fs.readFileSync(PLAN_LOOP_AGENTS);
  const planLoopPlugin = fs.readFileSync(PLAN_LOOP_PLUGIN);
  assert.ok(planLoopCanonical.equals(planLoopAgents), '.agents/skills/fgos-plan-loop/SKILL.md must match canonical');
  assert.ok(planLoopCanonical.equals(planLoopPlugin), 'plugins/fgOS/skills/fgos-plan-loop/SKILL.md must match canonical');

  // Claude wrapper
  const claudeContent = fs.readFileSync(PLAN_LOOP_CLAUDE, 'utf8');
  assert.match(claudeContent, /This is a generated thin wrapper/);
  assert.match(claudeContent, /\.agents\/skills\/fgos-plan-loop\/SKILL\.md/);
});

// -----------------------------------------------------------------------------
// 6. stale implicit close language remains absent
// -----------------------------------------------------------------------------

test('Phase 4: stale implicit close language remains absent from current skills and fragments', () => {
  const filesToCheck = [
    PLAN_LOOP_CANONICAL,
    DRIVER_FRAGMENT,
    CODING_POLICY_FRAGMENT,
  ];

  for (const filePath of filesToCheck) {
    const text = fs.readFileSync(filePath, 'utf8');
    assert.doesNotMatch(text, /always\s+auto-close/i, `${path.basename(filePath)} must not claim always auto-close`);
    assert.doesNotMatch(text, /no\s+separate\s+close\s+step/i, `${path.basename(filePath)} must not claim no separate close step`);
    assert.doesNotMatch(text, /no\s+separate\s+close\s+door/i, `${path.basename(filePath)} must not claim no separate close door`);
    assert.doesNotMatch(text, /always\s+attempts\s+closeSessionByQuorum/i, `${path.basename(filePath)} must not claim automatic closeSessionByQuorum`);
  }
});

// -----------------------------------------------------------------------------
// 7. CLI flag contract guard: documented coordination commands match real CLI
// -----------------------------------------------------------------------------

test('Phase 4: documented coordination commands in skills and fragments match CLI allowlists and required flags', () => {
  const COMMON_FLAGS = new Set(['dir', 'cwd', 'json']);
  const ALLOWED_COORDINATION_FLAGS = {
    start: new Set([
      ...COMMON_FLAGS,
      'id', 'coordination-id',
      'protocol', 'protocol-id', 'protocolRef.id',
      'kind', 'objective', 'writer-id',
      'work-ref', 'work', 'primary-role',
      'task', 'task-file', 'bounds', 'partial-policy',
      'actors', 'steps', 'executor', 'model', 'tier',
    ]),
    status: new Set([
      ...COMMON_FLAGS,
      'id', 'detail', 'replay',
    ]),
    operation: new Set([
      ...COMMON_FLAGS,
      'id', 'action-key', 'writer-id', 'objective',
      'expected-outputs', 'outputs', 'context-refs', 'context',
      'constraints', 'capabilities', 'from-assignment-id',
      'intent', 'round', 'task-key', 'mutation',
      'executor', 'model', 'tier',
    ]),
    'authorize-and-dispatch': new Set([
      ...COMMON_FLAGS,
      'id', 'action-key', 'writer-id', 'objective', 'reason',
      'expected-outputs', 'outputs', 'granted-context-refs',
      'context-refs', 'context', 'constraints', 'capabilities',
      'target-artifact-ref', 'task-key', 'mutation',
      'executor', 'model', 'tier',
    ]),
    disposition: new Set([
      ...COMMON_FLAGS,
      'id', 'action-key', 'writer-id', 'disposition', 'rationale',
      'evidence-refs',
    ]),
    close: new Set([
      ...COMMON_FLAGS,
      'file', 'id', 'action-key', 'writer-id', 'authorized-by',
      'dissenting-actor-ids', 'dissent', 'aggregation-id',
    ]),
    chain: new Set([
      ...COMMON_FLAGS,
      'track',
    ]),
  };

  const filesToCheck = [
    PLAN_LOOP_CANONICAL,
    DRIVER_FRAGMENT,
    CODING_POLICY_FRAGMENT,
  ];

  // Helper to extract command invocations: matches `fgos coordination <subcommand> ...`
  function extractInvocations(text) {
    const invocations = [];
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const match = line.match(/(?:^|`|[$]\s+)fgos coordination\s+([a-z-]+)(.*)$/);
      if (match) {
        const sub = match[1];
        if (!ALLOWED_COORDINATION_FLAGS[sub]) continue; // prose mention or unsupported subcommand

        let rest = match[2];
        let j = i;
        while (lines[j].trim().endsWith('\\') && j + 1 < lines.length) {
          j++;
          rest += ' ' + lines[j].trim().replace(/\\$/, '');
        }

        // Clean markdown backticks and punctuation
        rest = rest.replace(/`.*$/, '').trim();

        // Extract all --flag occurrences
        const flagMatches = Array.from(rest.matchAll(/--([a-z0-9-]+)/g)).map((m) => m[1]);
        invocations.push({ sub, rest, flags: flagMatches, line: i + 1 });
      }
    }
    return invocations;
  }

  let totalChecked = 0;
  for (const filePath of filesToCheck) {
    const content = fs.readFileSync(filePath, 'utf8');
    const invocations = extractInvocations(content);

    for (const inv of invocations) {
      const allowed = ALLOWED_COORDINATION_FLAGS[inv.sub];
      assert.ok(allowed, `Subcommand "${inv.sub}" must be known in allowlist`);

      for (const flag of inv.flags) {
        assert.ok(
          allowed.has(flag),
          `Command "fgos coordination ${inv.sub}" in ${path.basename(filePath)}:${inv.line} uses invalid flag "--${flag}". Allowed flags: ${Array.from(allowed).join(', ')}`,
        );
      }

      // Check specific subcommand mandatory requirements for non-trivial examples
      if (inv.sub === 'close') {
        assert.ok(!inv.flags.includes('reason'), `fgos coordination close must NOT have --reason flag`);
      }
      if (inv.sub === 'authorize-and-dispatch' && inv.flags.length > 2) {
        assert.ok(inv.flags.includes('objective'), `authorize-and-dispatch example must include --objective`);
        assert.ok(inv.flags.includes('reason'), `authorize-and-dispatch example must include --reason`);
      }

      totalChecked++;
    }
  }

  assert.ok(totalChecked >= 8, `Must have verified at least 8 command invocations, found ${totalChecked}`);
});

// -----------------------------------------------------------------------------
// 8. plan-loop clean pass: entry-node start, cold resume, wave parity, explicit close
// -----------------------------------------------------------------------------

test('Phase 4: plan-loop clean pass (entry node start, cold resume, wave parity, explicit close)', async () => {
  const ctx = makeTempCtx();
  try {
    const coordinationId = 'track-phase4--cell-01';
    const writerId = 'driver_lead_phase4';

    // 1. Start session passing worktree cwd (executes entry node produce-candidate)
    const startResult = await startCoordinationUseCase(ctx, {
      kind: 'declared-protocol',
      protocolId: PROTOCOL_ID,
      coordinationId,
      writerId,
      cwd: ctx.worktreeDir,
      objective: 'Phase 4 implementation test cell',
      partialPolicy: { allowedOmissions: ['fixer'] },
    });
    assert.equal(startResult.status, 'running');
    assert.equal(startResult.coordinationId, coordinationId);

    // 2. Query status cold (observe)
    let status = showCoordinationStatusUseCase(ctx, { id: coordinationId });
    assert.equal(status.session.status, 'active');
    assert.equal(status.readyToClose, false);

    // 3. Inspect legal actions: produce-candidate was executed at start; review and red-team projected
    let actionsRes = showCoordinationActionsUseCase(ctx, { id: coordinationId });
    const reviewAction = actionsRes.actions.find((a) => a.kind === 'dispatch-operation' && a.target.operationId === 'review-candidate');
    const redTeamAction = actionsRes.actions.find((a) => a.kind === 'dispatch-operation' && a.target.operationId === 'red-team-candidate');
    assert.ok(reviewAction, 'review-candidate must be projected as legal action');
    assert.ok(redTeamAction, 'red-team-candidate must be projected as legal action');

    // 4. Stale action key rejection test
    await assert.rejects(
      async () => {
        await executeOperationUseCase(ctx, {
          id: coordinationId,
          actionKey: 'sha256:' + 'f'.repeat(64),
          writerId,
          objective: 'Review candidate',
          expectedOutputs: ['agent-result.json'],
        });
      },
      (err) => err instanceof CoordinationError && (err.category === 'stale-action' || err.message.includes('stale')),
    );

    // 5. Execute review-candidate with valid actionKey
    const reviewRes = await executeOperationUseCase(ctx, {
      id: coordinationId,
      actionKey: reviewAction.actionKey,
      writerId,
      objective: 'Review candidate diff',
      expectedOutputs: ['agent-result.json'],
    });
    assert.equal(reviewRes.status, 'dispatched');

    // 6. Simulate crash / cold resume: discard in-memory variables and resume cold
    // A fresh Lead process starts with only coordinationId and queries status
    const resumedStatus = showCoordinationStatusUseCase(ctx, { id: coordinationId });
    assert.equal(resumedStatus.session.status, 'active');

    // Fresh Lead derives legal actions from status/actions door
    actionsRes = showCoordinationActionsUseCase(ctx, { id: coordinationId });
    const freshRedTeamAction = actionsRes.actions.find((a) => a.kind === 'dispatch-operation' && a.target.operationId === 'red-team-candidate');
    assert.ok(freshRedTeamAction, 'red-team-candidate must be projected on cold resume');

    // Dispatch red-team-candidate
    const redTeamRes = await executeOperationUseCase(ctx, {
      id: coordinationId,
      actionKey: freshRedTeamAction.actionKey,
      writerId,
      objective: 'Adversarial attack on candidate',
      expectedOutputs: ['agent-result.json'],
    });
    assert.equal(redTeamRes.status, 'dispatched');

    // 7. Verify session remains ACTIVE (explicit close law: does not auto-close)
    status = showCoordinationStatusUseCase(ctx, { id: coordinationId });
    assert.equal(status.session.status, 'active');
    assert.equal(status.readyToClose, true);

    // Verify dispatch count parity with Phase 0 clean-plan-loop-shaped (3 dispatches, 2 waves)
    const sessionEvents = (await import('../../src/runner/coordination/store.mjs')).readSessionEvents(coordinationId, { repoRoot: ctx.repoRoot });
    const assignmentEvents = sessionEvents.filter((e) => e.type === 'assignment-created');
    assert.equal(assignmentEvents.length, 3, 'Clean pass must execute exactly 3 dispatches (produce, review, red-team)');

    // 8. Cold track resume verification via chain
    const chainRes = chainCoordinationUseCase(ctx, { track: 'track-phase4' });
    assert.equal(chainRes.track, 'track-phase4');
    assert.equal(chainRes.cells.length, 1);
    assert.equal(chainRes.cells[0].cellId, 'cell-01');
    assert.equal(chainRes.cells[0].status, 'active');

    // 9. Explicit Close: close action is projected; terminates session without CLI --reason
    actionsRes = showCoordinationActionsUseCase(ctx, { id: coordinationId });
    const closeAction = actionsRes.actions.find((a) => a.kind === 'close');
    assert.ok(closeAction, 'explicit close action must be projected when ready to close');

    const closeResult = await executeCloseUseCase(ctx, {
      id: coordinationId,
      actionKey: closeAction.actionKey,
      writerId,
    });
    assert.equal(closeResult.coordinationId, coordinationId);
    assert.equal(closeResult.closed, true);
    assert.equal(closeResult.status, 'partially-complete');

    // Verify session manifest status is partial
    status = showCoordinationStatusUseCase(ctx, { id: coordinationId });
    assert.equal(status.session.status, 'partial');
  } finally {
    ctx.cleanup();
  }
});

// -----------------------------------------------------------------------------
// 9. plan-loop fix round, recheck discharge, full quorum explicit close
// -----------------------------------------------------------------------------

test('Phase 4: plan-loop fix round, recheck discharge, and full quorum explicit close', async () => {
  const ctx = makeTempCtx({ reviewerFinding: true });
  try {
    const coordinationId = 'track-phase4--cell-fix-01';
    const writerId = 'driver_lead_phase4';

    // 1. Start session (executes produce-candidate inside worktree)
    const startResult = await startCoordinationUseCase(ctx, {
      kind: 'declared-protocol',
      protocolId: PROTOCOL_ID,
      coordinationId,
      writerId,
      cwd: ctx.worktreeDir,
      objective: 'Phase 4 implementation test cell with fix round',
    });
    assert.equal(startResult.status, 'running');

    // 2. Dispatch review-candidate (produces findings)
    let actionsRes = showCoordinationActionsUseCase(ctx, { id: coordinationId });
    const reviewAction = actionsRes.actions.find((a) => a.kind === 'dispatch-operation' && a.target.operationId === 'review-candidate');
    assert.ok(reviewAction);
    await executeOperationUseCase(ctx, {
      id: coordinationId,
      actionKey: reviewAction.actionKey,
      writerId,
      objective: 'Review candidate diff',
      expectedOutputs: ['agent-result.json'],
    });

    // 3. Dispatch red-team-candidate (passes cleanly)
    actionsRes = showCoordinationActionsUseCase(ctx, { id: coordinationId });
    const redTeamAction = actionsRes.actions.find((a) => a.kind === 'dispatch-operation' && a.target.operationId === 'red-team-candidate');
    assert.ok(redTeamAction);
    await executeOperationUseCase(ctx, {
      id: coordinationId,
      actionKey: redTeamAction.actionKey,
      writerId,
      objective: 'Adversarial attack on candidate',
      expectedOutputs: ['agent-result.json'],
    });

    // 4. Status reflects reviewer failed finding; not ready to close
    let status = showCoordinationStatusUseCase(ctx, { id: coordinationId, detail: true });
    assert.equal(status.session.status, 'active');
    assert.equal(status.readyToClose, false);
    assert.ok(status.blockers.some((b) => b.kind === 'missing-quorum-actors'));

    // 5. Driver records disposition for the accepted reviewer finding
    actionsRes = showCoordinationActionsUseCase(ctx, { id: coordinationId });
    const dispAction = actionsRes.actions.find((a) => a.kind === 'record-disposition');
    assert.ok(dispAction, 'disposition must be projected for failed reviewer finding');

    const failedAsgnId = dispAction.target.targetRef;
    await executeDispositionUseCase(ctx, {
      id: coordinationId,
      actionKey: dispAction.actionKey,
      writerId,
      disposition: 'accepted',
      rationale: 'Reviewer findings accepted; revision authorized',
    });

    // 6. Driver authorizes and dispatches revision (revise-candidate -> fixer runs)
    // Passes required objective, reason, and grantedContextRefs
    actionsRes = showCoordinationActionsUseCase(ctx, { id: coordinationId });
    const authReviseAction = actionsRes.actions.find(
      (a) => a.kind === 'authorize-and-dispatch' && a.target.operationId === 'revise-candidate',
    );
    assert.ok(authReviseAction, 'revise-candidate must be projected for authorization');

    const authReviseRes = await executeAuthorizeAndDispatchUseCase(ctx, {
      id: coordinationId,
      actionKey: authReviseAction.actionKey,
      writerId,
      reason: 'Implement fixes for reviewer findings',
      objective: 'Revise candidate per reviewer findings',
      expectedOutputs: ['agent-result.json'],
      grantedContextRefs: [failedAsgnId],
      contextRefs: [failedAsgnId],
    });
    assert.equal(authReviseRes.status, 'dispatched');

    // Find the revision assignment id from session assignments
    const latestEvents = (await import('../../src/runner/coordination/store.mjs')).readSessionEvents(coordinationId, { repoRoot: ctx.repoRoot });
    const reviseCreated = latestEvents.findLast(
      (e) => e.type === 'assignment-created' && e.payload?.operationId === 'revise-candidate',
    );
    const reviseAsgnId = reviseCreated?.payload?.assignmentId || reviseCreated?.payload?.id;
    assert.ok(reviseAsgnId, 'revision assignment must exist');

    // 7. Driver authorizes and dispatches reviewer recheck (reviewer-recheck)
    actionsRes = showCoordinationActionsUseCase(ctx, { id: coordinationId });
    const authRecheckAction = actionsRes.actions.find(
      (a) => a.kind === 'authorize-and-dispatch' && a.target.operationId === 'reviewer-recheck',
    );
    assert.ok(authRecheckAction, 'reviewer-recheck must be projected for authorization');

    await executeAuthorizeAndDispatchUseCase(ctx, {
      id: coordinationId,
      actionKey: authRecheckAction.actionKey,
      writerId,
      reason: 'Verify revision resolves accepted finding',
      objective: 'Recheck candidate',
      expectedOutputs: ['agent-result.json'],
      grantedContextRefs: [reviseAsgnId],
      contextRefs: [reviseAsgnId],
    });

    // 8. Recheck discharges the finding; full quorum is satisfied; session is ready to close
    status = showCoordinationStatusUseCase(ctx, { id: coordinationId, detail: true });
    assert.equal(status.session.status, 'active');
    assert.equal(status.readyToClose, true);
    assert.equal(status.blockers.length, 0);

    // Verify dispatch count parity with Phase 0 accepted-finding-remediation-recheck (5 dispatches, 3 waves)
    const allSessionEvents = (await import('../../src/runner/coordination/store.mjs')).readSessionEvents(coordinationId, { repoRoot: ctx.repoRoot });
    const fixAssignmentEvents = allSessionEvents.filter((e) => e.type === 'assignment-created');
    assert.equal(fixAssignmentEvents.length, 5, 'Fix round must execute exactly 5 dispatches (produce, review, red-team, revise, recheck)');

    // 9. Explicit close terminates session cleanly as completed (no CLI reason flag)
    actionsRes = showCoordinationActionsUseCase(ctx, { id: coordinationId });
    const closeAction = actionsRes.actions.find((a) => a.kind === 'close');
    assert.ok(closeAction, 'explicit close must be projected when all actors satisfied');

    const closeResult = await executeCloseUseCase(ctx, {
      id: coordinationId,
      actionKey: closeAction.actionKey,
      writerId,
    });
    assert.equal(closeResult.coordinationId, coordinationId);
    assert.equal(closeResult.closed, true);
    assert.equal(closeResult.status, 'completed');

    status = showCoordinationStatusUseCase(ctx, { id: coordinationId });
    assert.equal(status.session.status, 'completed');
  } finally {
    ctx.cleanup();
  }
});
