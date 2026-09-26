import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import {
  startCoordinationUseCase,
} from '../../src/verbs/coordination/start.mjs';
import {
  showCoordinationStatusUseCase,
} from '../../src/verbs/coordination/status.mjs';
import {
  chainCoordinationUseCase,
} from '../../src/verbs/coordination/chain.mjs';
import {
  showCoordinationActionsUseCase,
  executeOperationUseCase,
  executeAuthorizeAndDispatchUseCase,
  executeDispositionUseCase,
  executeCloseUseCase,
} from '../../src/verbs/coordination/actions.mjs';
import { CoordinationError } from '../../src/runner/coordination/schema.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DRIVER_FRAGMENT = path.join(REPO_ROOT, 'core/skills/_shared/coordination-driver.md');
const CODING_POLICY_FRAGMENT = path.join(REPO_ROOT, 'domains/coding/skills/_shared/coding-cell-policy.md');
const PLAN_LOOP_CANONICAL = path.join(REPO_ROOT, 'core/skills/fgos-plan-loop/SKILL.md');
const PLAN_LOOP_AGENTS = path.join(REPO_ROOT, '.agents/skills/fgos-plan-loop/SKILL.md');
const PLAN_LOOP_PLUGIN = path.join(REPO_ROOT, 'plugins/fgOS/skills/fgos-plan-loop/SKILL.md');
const PLAN_LOOP_CLAUDE = path.join(REPO_ROOT, '.claude/skills/fgos-plan-loop/SKILL.md');

const PROTOCOL_ID = 'core.coordination-protocol.standalone-master-coordination-loop';

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function makeTempCtx({ reviewerFinding = false } = {}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-phase4-driver-test-'));
  const fgosDir = path.join(tmpDir, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });

  const fakeExec = path.join(tmpDir, 'fake-exec.mjs');
  fs.writeFileSync(fakeExec, `
    import fs from 'node:fs';
    import path from 'node:path';
    const assignmentsRoot = path.join(process.cwd(), '.fgos', 'assignments');
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
    cleanup: () => {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    },
  };
}

// -----------------------------------------------------------------------------
// 1. plan-loop skill is within budget
// -----------------------------------------------------------------------------

test('Phase 4: plan-loop skill is within word budget (target 800-1200 words, <= 1500 words)', () => {
  assert.ok(fs.existsSync(PLAN_LOOP_CANONICAL), 'canonical plan-loop skill must exist');
  const content = fs.readFileSync(PLAN_LOOP_CANONICAL, 'utf8');
  const words = countWords(content);
  assert.ok(
    words <= 1500,
    `plan-loop skill must be <= 1500 words (budget), got ${words} words`,
  );
  assert.ok(
    words >= 500,
    `plan-loop skill must have sufficient operational substance (>= 500 words), got ${words} words`,
  );
  // Compare to historical baseline (~3700 words) -> at least 60% reduction
  const historicalBaseline = 3700;
  const reductionPercent = ((historicalBaseline - words) / historicalBaseline) * 100;
  assert.ok(
    reductionPercent >= 60,
    `plan-loop word reduction must be at least 60% vs baseline (${historicalBaseline} words), achieved ${reductionPercent.toFixed(1)}% (${words} words)`,
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
    assert.match(
      content,
      new RegExp(`\`${hook}\``, 'i'),
      `driver discipline fragment must define hook slot "${hook}"`,
    );
  }

  // The 8 cycle steps must be present
  assert.match(content, /observe\(/i);
  assert.match(content, /choose one legal action/i);
  assert.match(content, /dispatch/i);
  assert.match(content, /verify evidence/i);
  assert.match(content, /disposition/i);
  assert.match(content, /adapt/i);
  assert.match(content, /explicit close/i);
  assert.match(content, /continuity artifact/i);
});

// -----------------------------------------------------------------------------
// 3. coding-cell fragment is reusable for one cell with no plan/track
// -----------------------------------------------------------------------------

test('Phase 4: coding-cell fragment is reusable for one cell with no plan/track assumptions', () => {
  assert.ok(fs.existsSync(CODING_POLICY_FRAGMENT), 'coding-cell policy fragment must exist');
  const content = fs.readFileSync(CODING_POLICY_FRAGMENT, 'utf8');

  // Must declare core coding cell mechanisms
  assert.match(content, /Isolated Worktree Discipline/i, 'must define isolated worktree discipline');
  assert.match(content, /Proof Tiers/i, 'must define proof tiers');
  assert.match(content, /Tier 1: Focused/i, 'must define focused proof tier');
  assert.match(content, /Tier 2: Affected/i, 'must define affected proof tier');
  assert.match(content, /Tier 3: Full-Suite Gate/i, 'must define full-suite gate tier');
  assert.match(content, /Independent Verification of Doer Commit/i, 'must require independent verification');
  assert.match(content, /Merge and Cleanup Only After Explicit Close/i, 'must enforce merge only after close');
  assert.match(content, /Tested and Integrated Identity/i, 'must define tested/integrated identity');
  assert.match(content, /testedSha/, 'must define testedSha');
  assert.match(content, /integratedSha/, 'must define integratedSha');
  assert.match(content, /treeIdentical/, 'must define treeIdentical exception');

  // Must be usable for one cell with no plan or track
  assert.match(content, /single-cell/i, 'must explicitly state reusability for single-cell changes');
  assert.doesNotMatch(content, /## 5\. Unattended track mode/, 'must not embed multi-cell track loop');
});

// -----------------------------------------------------------------------------
// 4. plan-loop no longer embeds raw request JSON or copied kernel rules
// -----------------------------------------------------------------------------

test('Phase 4: plan-loop no longer embeds raw request JSON or copied kernel rules', () => {
  const content = fs.readFileSync(PLAN_LOOP_CANONICAL, 'utf8');

  // No raw request JSON objects
  assert.doesNotMatch(content, /"kind":\s*"declared-protocol"/, 'must not embed raw request JSON');
  assert.doesNotMatch(content, /"type":\s*"operation"/, 'must not embed raw operation JSON steps');
  assert.doesNotMatch(content, /"type":\s*"authorize"/, 'must not embed raw authorize JSON steps');
  assert.doesNotMatch(content, /open\.json/, 'must not reference open.json file');
  assert.doesNotMatch(content, /fix-1\.json|fix-N\.json/, 'must not reference fix JSON files');
  assert.doesNotMatch(content, /close\.json/, 'must not reference close.json file');

  // No schema source-line citations
  assert.doesNotMatch(content, /schema\.mjs:\d+/, 'must not cite schema.mjs line numbers');
  assert.doesNotMatch(content, /TOP_LEVEL_ALLOWED_KEYS/, 'must not copy schema internal constant names');

  // Semantic command usage
  assert.match(content, /fgos coordination start/, 'must reference fgos coordination start');
  assert.match(content, /fgos coordination status/, 'must reference fgos coordination status');
  assert.match(content, /fgos coordination operation/, 'must reference fgos coordination operation');
  assert.match(content, /fgos coordination authorize-and-dispatch/, 'must reference fgos coordination authorize-and-dispatch');
  assert.match(content, /fgos coordination disposition/, 'must reference fgos coordination disposition');
  assert.match(content, /fgos coordination close/, 'must reference fgos coordination close');
  assert.match(content, /fgos coordination chain/, 'must reference fgos coordination chain');

  // Domain ownership statement (corrected from "domain-agnostic")
  assert.doesNotMatch(content, /domain-agnostic planning surface/i, 'must not claim to be domain-agnostic planning surface');
  assert.match(content, /implementation-track facade/i, 'must identify as implementation-track facade');
});

// -----------------------------------------------------------------------------
// 5. generated skill projections are byte-identical to canonical sources
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
// 7. plan-loop clean/fix/recheck/crash-resume/stale-action/explicit-close cases
// -----------------------------------------------------------------------------

test('Phase 4: plan-loop semantic control flow (clean pass, resume, stale-action, explicit close)', async () => {
  const ctx = makeTempCtx();
  try {
    const coordinationId = 'track-phase4--cell-01';
    const writerId = 'driver_lead_phase4';

    // 1. Start session using semantic command
    const startResult = await startCoordinationUseCase(ctx, {
      kind: 'declared-protocol',
      protocolId: PROTOCOL_ID,
      coordinationId,
      writerId,
      objective: 'Phase 4 implementation test cell',
      partialPolicy: { allowedOmissions: ['fixer'] },
    });
    assert.equal(startResult.status, 'running');
    assert.equal(startResult.coordinationId, coordinationId);

    // 2. Query status cold (observe)
    let status = showCoordinationStatusUseCase(ctx, { id: coordinationId });
    assert.equal(status.session.status, 'active');
    assert.equal(status.readyToClose, false);

    // 3. Inspect legal actions (produce-candidate executed at entry node during start; review-candidate and red-team-candidate projected)
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

    // 6. Execute red-team-candidate with valid actionKey
    actionsRes = showCoordinationActionsUseCase(ctx, { id: coordinationId });
    const freshRedTeamAction = actionsRes.actions.find((a) => a.kind === 'dispatch-operation' && a.target.operationId === 'red-team-candidate');
    assert.ok(freshRedTeamAction, 'red-team-candidate must remain projected');
    const redTeamRes = await executeOperationUseCase(ctx, {
      id: coordinationId,
      actionKey: freshRedTeamAction.actionKey,
      writerId,
      objective: 'Adversarial attack on candidate',
      expectedOutputs: ['agent-result.json'],
    });
    assert.equal(redTeamRes.status, 'dispatched');

    // 7. Verify session remains ACTIVE (explicit-close invariant: does NOT auto-close)
    status = showCoordinationStatusUseCase(ctx, { id: coordinationId });
    assert.equal(status.session.status, 'active');
    assert.equal(status.readyToClose, true);

    // 8. Cold resume verification via chain
    const chainRes = chainCoordinationUseCase(ctx, { track: 'track-phase4' });
    assert.equal(chainRes.track, 'track-phase4');
    assert.equal(chainRes.cells.length, 1);
    assert.equal(chainRes.cells[0].cellId, 'cell-01');
    assert.equal(chainRes.cells[0].status, 'active');

    // 9. Explicit Close: close action is projected and terminates session
    actionsRes = showCoordinationActionsUseCase(ctx, { id: coordinationId });
    const closeAction = actionsRes.actions.find((a) => a.kind === 'close');
    assert.ok(closeAction, 'explicit close action must be projected when ready to close');

    const closeResult = await executeCloseUseCase(ctx, {
      id: coordinationId,
      actionKey: closeAction.actionKey,
      writerId,
      reason: 'Phase 4 proof complete: all operations verified',
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
// 8. plan-loop fix round, recheck discharge, and full quorum explicit close
// -----------------------------------------------------------------------------

test('Phase 4: plan-loop fix round, recheck discharge, and full quorum explicit close', async () => {
  const ctx = makeTempCtx({ reviewerFinding: true });
  try {
    const coordinationId = 'track-phase4--cell-fix-01';
    const writerId = 'driver_lead_phase4';

    // 1. Start session (no partialPolicy -> requires all actors to complete)
    const startResult = await startCoordinationUseCase(ctx, {
      kind: 'declared-protocol',
      protocolId: PROTOCOL_ID,
      coordinationId,
      writerId,
      objective: 'Phase 4 implementation test cell with fix round',
    });
    assert.equal(startResult.status, 'running');

    // 2. Dispatch review-candidate (which will produce findings)
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
      objective: 'Revise candidate',
      expectedOutputs: ['agent-result.json'],
      grantedContextRefs: [failedAsgnId],
      contextRefs: [failedAsgnId],
    });
    assert.equal(authReviseRes.status, 'dispatched');

    // Find the revision assignment id from session assignments
    const revStatus = showCoordinationStatusUseCase(ctx, { id: coordinationId, detail: true });
    const authRevAsgn = revStatus.snapshot ? revStatus.session : null;
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

    // 9. Explicit close terminates session cleanly as completed
    actionsRes = showCoordinationActionsUseCase(ctx, { id: coordinationId });
    const closeAction = actionsRes.actions.find((a) => a.kind === 'close');
    assert.ok(closeAction, 'explicit close must be projected when all actors satisfied');

    const closeResult = await executeCloseUseCase(ctx, {
      id: coordinationId,
      actionKey: closeAction.actionKey,
      writerId,
      reason: 'All operations and rechecks verified; fix round discharged',
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
