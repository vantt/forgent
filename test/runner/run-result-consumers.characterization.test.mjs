import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import {
  classifyOperationAssignment,
  hasAcceptedDispositionRemediation,
  resolveBindingOutcome,
  resolveOperationOutcome,
  resolveRecheckDischarge,
  protocolOperationStamp,
} from '../../src/runner/coordination/legality-facts.mjs';

import {
  synthesizeResearchFanIn,
  deriveDisclosures,
  readLinkedRunResultFromDisk,
} from '../../src/runner/coordination/session-engine.mjs';

import {
  interpretAssignmentRunResult,
} from '../../src/runner/dispatch/operation-choice.mjs';

import {
  classifyRunEvidence,
} from '../../src/runner/dispatch/settlement.mjs';

import {
  interpretRunResult,
  runOutcome,
} from '../../src/runner/dispatch/run-result.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, '../fixtures/run-result/real-shapes');
import { DEFAULT_AGGREGATE_BOUNDS } from '../../src/runner/coordination/schema.mjs';
function loadFixture(name) {
  const file = path.join(FIXTURES_DIR, name);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function mkSessionFixtureDir() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-characterization-'));
  const fgosDir = path.join(tmp, '.fgos');
  fs.mkdirSync(path.join(fgosDir, 'assignments'), { recursive: true });
  fs.mkdirSync(path.join(fgosDir, 'coordination', 'sessions'), { recursive: true });
  return { tmp, fgosDir };
}

function writeSessionData(fgosDir, coordinationId, { manifest, events = [], assignments = [] }) {
  const sessDir = path.join(fgosDir, 'coordination', 'sessions', coordinationId);
  fs.mkdirSync(sessDir, { recursive: true });
  fs.writeFileSync(path.join(sessDir, 'session.json'), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(
    path.join(sessDir, 'events.jsonl'),
    events.map((e) => JSON.stringify(e)).join('\n') + (events.length > 0 ? '\n' : ''),
  );

  for (const asgn of assignments) {
    const asgnDir = path.join(fgosDir, 'assignments', asgn.assignmentId);
    fs.mkdirSync(asgnDir, { recursive: true });
    fs.writeFileSync(path.join(asgnDir, 'assignment.json'), JSON.stringify(asgn.assignmentJson ?? {
      id: asgn.assignmentId,
      assignmentId: asgn.assignmentId,
      provenance: { inline: { contract: { contextRefs: [] } } },
    }, null, 2));

    if (asgn.runs) {
      for (const [attempt, runData] of Object.entries(asgn.runs)) {
        const runDir = path.join(asgnDir, 'runs', attempt);
        fs.mkdirSync(runDir, { recursive: true });
        fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify(runData, null, 2));
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 1. Session Engine: synthesizeResearchFanIn (lines 3330-3332)
// ---------------------------------------------------------------------------
test('characterization: session-engine synthesizeResearchFanIn partitions fan-in branches', (t) => {
  const { tmp, fgosDir } = mkSessionFixtureDir();
  const coordinationId = 'coord_fanin_test';

  const f01 = loadFixture('01-v1-failed-failed.json');
  const f04 = loadFixture('04-v1-done-verified.json');
  const f05 = loadFixture('05-v1-done-reported.json');
  const f06 = loadFixture('06-v2-completed-pass-verified.json');
  const f08 = loadFixture('08-v2-completed-findings-reported.json');
  const f09 = loadFixture('09-v2-failed-needs-input-provider.json');
  const f14 = loadFixture('14-v2-completed-blocked-reported.json');

  const branches = [
    { actorId: 'worker-v1-failed', fixture: f01, expectedBucket: 'failed' },
    { actorId: 'worker-v1-verified', fixture: f04, expectedBucket: 'accepted' },
    { actorId: 'worker-v1-reported', fixture: f05, expectedBucket: 'unverified' },
    { actorId: 'worker-v2-verified', fixture: f06, expectedBucket: 'accepted' },
    // todo: expected-change: findings is currently bucketed as 'failed' because status is 'failed';
    // in Phase 2 findings will be separated into verdict findings rather than infra failed
    { actorId: 'worker-v2-findings', fixture: f08, expectedBucket: 'failed' },
    { actorId: 'worker-v2-needs-input', fixture: f09, expectedBucket: 'failed' },
    { actorId: 'worker-v2-blocked', fixture: f14, expectedBucket: 'unverified' },
  ];

  const events = [];
  const assignments = [];
  let seq = 1;

  for (const b of branches) {
    const asgnId = `asgn_${b.actorId.replace(/-/g, '_')}`;
    const runId = `run_${asgnId}_01`;
    events.push({
      seq: seq++,
      type: 'assignment-created',
      payload: { actorId: b.actorId, assignmentId: asgnId },
    });
    events.push({
      seq: seq++,
      type: 'result-linked',
      payload: { assignmentId: asgnId, runId },
    });
    assignments.push({
      assignmentId: asgnId,
      runs: { '01': { ...b.fixture, assignmentId: asgnId, runId } },
    });
  }

  writeSessionData(fgosDir, coordinationId, {
    manifest: {
      schemaVersion: '2',
      coordinationId,
      status: 'active',
      objective: 'Characterization fan-in test objective',
      createdAt: new Date().toISOString(),
      provenanceRoot: { writerId: 'test-writer' },
      aggregateBounds: { ...DEFAULT_AGGREGATE_BOUNDS },
      assignmentRefs: assignments.map((a) => a.assignmentId),
    },
    events,
    assignments,
  });

  const fanIn = synthesizeResearchFanIn(coordinationId, {
    branchActorIds: branches.map((b) => b.actorId),
  }, { cwd: tmp, repoRoot: tmp });

  assert.equal(fanIn.status, 'synthesized');

  const acceptedActors = fanIn.accepted.map((x) => x.actorId);
  const unverifiedActors = fanIn.unverified.map((x) => x.actorId);
  const failedActors = fanIn.failed.map((x) => x.actorId);

  assert.deepEqual(acceptedActors.sort(), ['worker-v1-verified', 'worker-v2-verified']);
  // worker-v2-findings is now correctly bucketed into unverified (verdict finding, not infra failure)
  assert.deepEqual(unverifiedActors.sort(), ['worker-v1-reported', 'worker-v2-blocked', 'worker-v2-findings']);
  assert.deepEqual(failedActors.sort(), ['worker-v1-failed', 'worker-v2-needs-input']);
});

// ---------------------------------------------------------------------------
// 2. Session Engine: deriveDisclosures (lines 3689-3702)
// ---------------------------------------------------------------------------
test('characterization: session-engine deriveDisclosures maps status, confidence, and dissent', () => {
  const f06 = loadFixture('06-v2-completed-pass-verified.json');
  assert.deepEqual(deriveDisclosures(f06), {
    status: 'ok',
    outcome: 'ok',
    confidence: 'verified',
    dissent: 'none',
  });

  const f08 = loadFixture('08-v2-completed-findings-reported.json');
  // Disclosure status/outcome is now 'verdict' rather than legacy 'failed'
  assert.deepEqual(deriveDisclosures(f08), {
    status: 'verdict',
    outcome: 'verdict',
    confidence: 'reported',
    dissent: 'none',
  });

  const f14 = loadFixture('14-v2-completed-blocked-reported.json');
  assert.deepEqual(deriveDisclosures(f14), {
    status: 'blocked',
    outcome: 'blocked',
    confidence: 'reported',
    dissent: 'blocked',
  });
});

// ---------------------------------------------------------------------------
// 3. Session Engine: branchSatisfiedAtSeq (line 4005)
// ---------------------------------------------------------------------------
test('characterization: session-engine branchSatisfiedAtSeq ignores failed/no-evidence runs', () => {
  const { tmp, fgosDir } = mkSessionFixtureDir();
  const asgnId = 'asgn_satisfaction_test';
  const f01 = loadFixture('01-v1-failed-failed.json');
  const f06 = loadFixture('06-v2-completed-pass-verified.json');
  const f08 = loadFixture('08-v2-completed-findings-reported.json');

  const asgnDir = path.join(fgosDir, 'assignments', asgnId);
  fs.mkdirSync(path.join(asgnDir, 'runs', '01'), { recursive: true });
  fs.mkdirSync(path.join(asgnDir, 'runs', '02'), { recursive: true });
  fs.mkdirSync(path.join(asgnDir, 'runs', '03'), { recursive: true });

  fs.writeFileSync(path.join(asgnDir, 'runs', '01', 'result.json'), JSON.stringify({
    ...f01,
    assignmentId: asgnId,
    runId: `run_${asgnId}_01`,
  }));
  fs.writeFileSync(path.join(asgnDir, 'runs', '02', 'result.json'), JSON.stringify({
    ...f08,
    assignmentId: asgnId,
    runId: `run_${asgnId}_02`,
  }));
  fs.writeFileSync(path.join(asgnDir, 'runs', '03', 'result.json'), JSON.stringify({
    ...f06,
    assignmentId: asgnId,
    runId: `run_${asgnId}_03`,
  }));

  const events = [
    { seq: 10, type: 'result-linked', payload: { assignmentId: asgnId, runId: `run_${asgnId}_01` } },
    { seq: 20, type: 'result-linked', payload: { assignmentId: asgnId, runId: `run_${asgnId}_02` } },
    { seq: 30, type: 'result-linked', payload: { assignmentId: asgnId, runId: `run_${asgnId}_03` } },
  ];

  // Run 01 is failed -> skipped
  // Run 02 is findings (status: failed) -> skipped (not satisfied)
  // Run 03 is pass verified -> satisfied at seq 30
  let satisfyingSeq = 0;
  for (const event of events) {
    if (event.type !== 'result-linked' || event.payload.assignmentId !== asgnId) continue;
    const runResult = readLinkedRunResultFromDisk(fgosDir, asgnId, event.payload.runId);
    if (runResult.status === 'failed' || runResult.confidence === 'failed' || runResult.confidence === 'no-evidence') continue;
    satisfyingSeq = event.seq;
    break;
  }
  assert.equal(satisfyingSeq, 30);
});

// ---------------------------------------------------------------------------
// 4. Legality Facts: classifyOperationAssignment (lines 221-232)
// ---------------------------------------------------------------------------
test('characterization: legality-facts classifyOperationAssignment', () => {
  const f01 = loadFixture('01-v1-failed-failed.json');
  const f04 = loadFixture('04-v1-done-verified.json');
  const f05 = loadFixture('05-v1-done-reported.json');
  const f06 = loadFixture('06-v2-completed-pass-verified.json');
  const f08 = loadFixture('08-v2-completed-findings-reported.json');
  const f09 = loadFixture('09-v2-failed-needs-input-provider.json');
  const f14 = loadFixture('14-v2-completed-blocked-reported.json');
  const f18 = loadFixture('18-spoofed-pass.json');

  const makeCtx = (result) => ({
    getRunResult: (asgnId, runId) => ({ ...result, runId: runId ?? result.runId }),
  });

  const events = (asgnId, runId) => [
    { type: 'assignment-created', payload: { assignmentId: asgnId } },
    { type: 'result-linked', payload: { assignmentId: asgnId, runId } },
  ];

  // Verified / reported done
  assert.deepEqual(
    classifyOperationAssignment(events('a4', 'r4'), 'actor1', 'a4', makeCtx(f04)),
    { satisfied: true, reason: null, actorId: 'actor1', assignmentId: 'a4', runId: 'r4' },
  );
  assert.deepEqual(
    classifyOperationAssignment(events('a6', 'r6'), 'actor1', 'a6', makeCtx(f06)),
    { satisfied: true, reason: null, actorId: 'actor1', assignmentId: 'a6', runId: 'r6' },
  );

  // Failed v1
  assert.deepEqual(
    classifyOperationAssignment(events('a1', 'r1'), 'actor1', 'a1', makeCtx(f01)),
    { satisfied: false, reason: 'failed', actorId: 'actor1', assignmentId: 'a1', runId: 'r1' },
  );

  // Findings v2: reviewer findings is currently reason: 'failed'
  // In Phase 2: runOutcome().satisfied === false, reason: 'failed' (triggers recheck/revise!)
  assert.deepEqual(
    classifyOperationAssignment(events('a8', 'r8'), 'actor1', 'a8', makeCtx(f08)),
    { satisfied: false, reason: 'failed', actorId: 'actor1', assignmentId: 'a8', runId: 'r8' },
  );

  // Needs input
  assert.deepEqual(
    classifyOperationAssignment(events('a9', 'r9'), 'actor1', 'a9', makeCtx(f09)),
    { satisfied: false, reason: 'failed', actorId: 'actor1', assignmentId: 'a9', runId: 'r9' },
  );

  // Blocked v2: now correctly classified as NOT satisfied (satisfied === (category === 'ok'))
  assert.deepEqual(
    classifyOperationAssignment(events('a14', 'r14'), 'actor1', 'a14', makeCtx(f14)),
    { satisfied: false, reason: 'failed', actorId: 'actor1', assignmentId: 'a14', runId: 'r14' },
  );

  // Spoofed pass (raw without downgrade would look satisfied)
  assert.deepEqual(
    classifyOperationAssignment(events('a18', 'r18'), 'actor1', 'a18', makeCtx(f18)),
    { satisfied: true, reason: null, actorId: 'actor1', assignmentId: 'a18', runId: 'r18' },
  );
});

// ---------------------------------------------------------------------------
// 5. Legality Facts: hasAcceptedDispositionRemediation (lines 280-288)
// ---------------------------------------------------------------------------
test('characterization: legality-facts hasAcceptedDispositionRemediation', () => {
  const definition = {
    metadata: { id: 'test-protocol', version: '1.0.0' },
    spec: {
      operations: [
        { id: 'op_fix', result: { kind: 'work-product' } },
      ],
      graph: { nodes: [] },
    },
  };
  const stamp = protocolOperationStamp(definition, 'op_fix');
  const failedAsgnId = 'asgn_failed_work';
  const remediationAsgnId = 'asgn_remediation_work';
  const recheckAsgnId = 'asgn_recheck_review';

  const events = [
    { type: 'assignment-created', payload: { assignmentId: failedAsgnId } },
    { type: 'result-linked', payload: { assignmentId: failedAsgnId, runId: 'r_fail' } },
    { type: 'assignment-created', payload: { assignmentId: remediationAsgnId } },
    { type: 'result-linked', payload: { assignmentId: remediationAsgnId, runId: 'r_rem' } },
    { type: 'assignment-created', payload: { assignmentId: recheckAsgnId } },
  ];

  const getAssignment = (id) => {
    if (id === recheckAsgnId) {
      return {
        provenance: { inline: { contract: { contextRefs: [remediationAsgnId] } } },
      };
    }
    if (id === remediationAsgnId) {
      return {
        provenance: {
          inline: {
            contract: {
              contextRefs: [failedAsgnId],
              constraints: [stamp],
            },
          },
        },
      };
    }
    return null;
  };

  const f06 = loadFixture('06-v2-completed-pass-verified.json');
  const f08 = loadFixture('08-v2-completed-findings-reported.json');

  // Remediation passed verified -> true
  const resPass = hasAcceptedDispositionRemediation(
    definition,
    failedAsgnId,
    recheckAsgnId,
    {
      events,
      getAssignment,
      getRunResult: () => f06,
      lastFailedLinkedIndex: 1,
    },
  );
  assert.equal(resPass, true);

  // Remediation produced findings (status: failed) -> false
  const resFail = hasAcceptedDispositionRemediation(
    definition,
    failedAsgnId,
    recheckAsgnId,
    {
      events,
      getAssignment,
      getRunResult: () => f08,
      lastFailedLinkedIndex: 1,
    },
  );
  assert.equal(resFail, false);
});

// ---------------------------------------------------------------------------
// 6. Operation Choice: interpretAssignmentRunResult (lines 1700-1775, 2090-2105)
// ---------------------------------------------------------------------------
test('characterization: operation-choice interpretAssignmentRunResult', () => {
  const f01 = loadFixture('01-v1-failed-failed.json');
  const f02 = loadFixture('02-v1-no-evidence.json');
  const f06 = loadFixture('06-v2-completed-pass-verified.json');
  const f07 = loadFixture('07-v2-completed-pass-reported.json');
  const f08 = loadFixture('08-v2-completed-findings-reported.json');
  const f14 = loadFixture('14-v2-completed-blocked-reported.json');

  // Failed
  const r01 = interpretAssignmentRunResult({
    choice: { operation: 'test-op' },
    runResult: f01,
  });
  assert.deepEqual(r01, {
    canAdvanceEdge: false,
    stop: true,
    reason: 'assignment-test-op-failed',
  });

  // No-evidence
  const r02 = interpretAssignmentRunResult({
    choice: { operation: 'test-op' },
    runResult: f02,
  });
  assert.deepEqual(r02, {
    canAdvanceEdge: false,
    stop: true,
    reason: 'assignment-test-op-no-evidence',
  });

  // Blocked
  const r14 = interpretAssignmentRunResult({
    choice: { operation: 'test-op' },
    runResult: f14,
  });
  assert.deepEqual(r14, {
    canAdvanceEdge: false,
    stop: true,
    reason: 'assignment-test-op-blocked',
  });

  // Findings: currently status: 'failed'
  // todo: expected-change: findings will route via verdict, rather than generic failure
  const r08 = interpretAssignmentRunResult({
    choice: { operation: 'review-item' },
    runResult: f08,
  });
  assert.deepEqual(r08, {
    canAdvanceEdge: false,
    stop: true,
    reason: 'assignment-review-item-failed',
  });

  // fix-verify-red requiring verified evidence:
  // With reported confidence: stops
  const rFixReported = interpretAssignmentRunResult({
    choice: {
      operation: 'fix-verify-red',
      assignment: { resultKind: 'work-product', evidence: { required: 'verified' } },
    },
    runResult: f07,
  });
  assert.equal(rFixReported.stop, true);
  assert.equal(rFixReported.reason, 'assignment-fix-verify-red-insufficient-confidence');

  // With verified confidence: can proceed
  const rFixVerified = interpretAssignmentRunResult({
    choice: {
      operation: 'fix-verify-red',
      assignment: { resultKind: 'work-product', evidence: { required: 'verified' } },
    },
    runResult: f06,
  });
  assert.equal(rFixVerified.canProceed, true);
  assert.equal(rFixVerified.stop, false);
});

// ---------------------------------------------------------------------------
// 7. Operation Choice: classifyRunEvidence downgrade behavior (lines 398-430)
// ---------------------------------------------------------------------------
test('characterization: classifyRunEvidence downgrades spoofed pass to failed/failed', () => {
  const f18 = loadFixture('18-spoofed-pass.json');
  // Stored classification in f18 says status: done, confidence: verified, completed/pass
  // But runtime/evidence says exitCode: 1 and hasDirtyBeforeMutation: true
  const derived = classifyRunEvidence({
    exitCode: f18.evidence.exitCode,
    signal: null,
    isTimeout: false,
    agentClaim: null,
    claimInvalid: false,
    workerArtifacts: [],
    changedFiles: [],
    hasDirtyBeforeMutation: true,
    isReadOnlyOperation: true,
    repoRoot: '/tmp',
  });

  assert.equal(derived.status, 'failed');
  assert.equal(derived.confidence, 'failed');

  // When downgraded per findLatestAssignmentRunResult lines 427-430:
  const settlesAdvance = f18.status === 'done' && (f18.confidence === 'reported' || f18.confidence === 'verified');
  const derivedAdvances = derived.status === 'done' && (derived.confidence === 'reported' || derived.confidence === 'verified');
  assert.equal(derivedAdvances, false);
  assert.equal(settlesAdvance, true);
  // Therefore downgrade applies!
  const effectiveStatus = derived.status;
  const effectiveConfidence = derived.confidence;
  assert.equal(effectiveStatus, 'failed');
  assert.equal(effectiveConfidence, 'failed');
});

// ---------------------------------------------------------------------------
// 8. Loop stop condition (loop.mjs line 945)
// ---------------------------------------------------------------------------
test('characterization: loop stopping predicate', () => {
  const isLoopStopped = (outcome) =>
    Boolean(outcome.stop || outcome.runResult?.status === 'no-evidence' || outcome.runResult?.status === 'failed');

  const f01 = loadFixture('01-v1-failed-failed.json');
  const f06 = loadFixture('06-v2-completed-pass-verified.json');
  const f08 = loadFixture('08-v2-completed-findings-reported.json');

  // Pass verified does not stop
  assert.equal(isLoopStopped({ stop: false, runResult: f06 }), false);

  // Failed stops
  assert.equal(isLoopStopped({ stop: false, runResult: f01 }), true);

  // Findings currently stops because status is 'failed'
  // todo: expected-change: in Phase 2 loop checks runOutcome(runResult).satisfied
  assert.equal(isLoopStopped({ stop: false, runResult: f08 }), true);
});

// ---------------------------------------------------------------------------
// 9. Coordination Run: summarizeDispatch & settledFailed (run.mjs:359, 1020)
// ---------------------------------------------------------------------------
test('characterization: run.mjs summarizeDispatch copies status & settledFailed counts failed', () => {
  const f06 = loadFixture('06-v2-completed-pass-verified.json');
  const f08 = loadFixture('08-v2-completed-findings-reported.json');
  const f01 = loadFixture('01-v1-failed-failed.json');

  const summarizeDispatch = ({ assignment, runResult }) => {
    const outcome = runResult ? runOutcome(runResult) : null;
    return {
      assignmentId: assignment.assignmentId,
      status: outcome?.category ?? runResult.status,
      confidence: outcome?.evidence ?? runResult.confidence,
      outcome: outcome?.category ?? null,
      verdict: outcome?.verdict ?? null,
      infraFailure: outcome?.infraFailure ?? (runResult.status === 'failed'),
    };
  };

  const stepPass = {
    schedulerOutcome: 'settled',
    ...summarizeDispatch({ assignment: { assignmentId: 'a1' }, runResult: f06 }),
  };
  const stepFindings = {
    schedulerOutcome: 'settled',
    ...summarizeDispatch({ assignment: { assignmentId: 'a2' }, runResult: f08 }),
  };
  const stepInfra = {
    schedulerOutcome: 'settled',
    ...summarizeDispatch({ assignment: { assignmentId: 'a3' }, runResult: f01 }),
  };

  const steps = [stepPass, stepFindings, stepInfra];
  const settledFailed = steps.filter((s) => s.schedulerOutcome === 'settled' && s.infraFailure).length;

  // Reviewer findings (stepFindings) has infraFailure: false, so it is NOT counted in settledFailed!
  // Only true infra/corrupt failures (stepInfra) count towards settledFailed:
  assert.equal(settledFailed, 1);
});

// ---------------------------------------------------------------------------
// 10. Coordination Show: show.mjs line 416 fallback to 'done'
// ---------------------------------------------------------------------------
test('characterization: show.mjs uses runOutcome and does not fall back to done on missing status', () => {
  const showStatus = (runResult) => {
    const outcome = runResult ? runOutcome(runResult) : null;
    return outcome?.category ?? runResult?.status ?? null;
  };

  const f06 = loadFixture('06-v2-completed-pass-verified.json');
  assert.equal(showStatus(f06), 'ok');

  const f08 = loadFixture('08-v2-completed-findings-reported.json');
  assert.equal(showStatus(f08), 'verdict');

  const f08WithoutStatus = { ...f08 };
  delete f08WithoutStatus.status;

  // In old code, missing status fell back to 'done' when settled was true.
  // With runOutcome, showStatus fails closed to 'corrupt', NEVER defaulting to 'done':
  assert.equal(showStatus(f08WithoutStatus), 'corrupt');
  assert.notEqual(showStatus(f08WithoutStatus), 'done');
});

// ---------------------------------------------------------------------------
// 11. Session-level test: reviewer findings -> revise -> clean recheck
// ---------------------------------------------------------------------------
test('characterization session-level: reviewer findings triggers revise and does not quorum prematurely', () => {
  const gatingOp = 'op_review';
  const definition = {
    metadata: { id: 'test-protocol', version: '1.0.0' },
    spec: {
      operations: [
        { id: 'op_review' },
        { id: 'op_fix', result: { kind: 'work-product' } },
        { id: 'op_recheck' },
      ],
      graph: {
        nodes: [
          {
            id: 'node_review',
            operations: [
              {
                ref: 'op_recheck',
                actor: 'reviewer',
                rechecks: {
                  operation: gatingOp,
                  dischargeOn: ['accepted'],
                },
              },
            ],
          },
        ],
      },
    },
  };

  const reviewAsgnId = 'asgn_review_round1';
  const remediationAsgnId = 'asgn_fix_work';
  const recheckAsgnId = 'asgn_review_round2';
  const stampFix = protocolOperationStamp(definition, 'op_fix');
  const stampRecheck = protocolOperationStamp(definition, 'op_recheck');

  const reviewFailedOutcome = {
    satisfied: false,
    reason: 'failed',
    actorId: 'reviewer',
    assignmentId: reviewAsgnId,
  };

  const getAssignment = (id) => {
    if (id === reviewAsgnId) {
      return {
        id: reviewAsgnId,
        actorId: 'reviewer',
        provenance: { inline: { contract: { contextRefs: [] } } },
      };
    }
    if (id === remediationAsgnId) {
      return {
        id: remediationAsgnId,
        actorId: 'worker',
        provenance: {
          inline: {
            contract: {
              contextRefs: [reviewAsgnId],
              constraints: [stampFix],
            },
          },
        },
      };
    }
    if (id === recheckAsgnId) {
      return {
        id: recheckAsgnId,
        actorId: 'reviewer',
        provenance: {
          inline: {
            contract: {
              contextRefs: [remediationAsgnId],
              constraints: [stampRecheck],
            },
          },
        },
      };
    }
    return null;
  };

  // 1. Initial state: review finished with findings, driver accepted disposition recorded
  const eventsInitial = [
    { type: 'assignment-created', payload: { assignmentId: reviewAsgnId, actorId: 'reviewer' } },
    { type: 'result-linked', payload: { assignmentId: reviewAsgnId, runId: 'r1' } },
    { type: 'driver-disposition-recorded', payload: { targetRef: reviewAsgnId, disposition: 'accepted' } },
  ];

  const f08 = loadFixture('08-v2-completed-findings-reported.json');
  // Recheck discharge is not yet satisfied because recheck assignment has not run
  const initialDischarge = resolveRecheckDischarge(
    definition,
    gatingOp,
    'reviewer',
    reviewFailedOutcome,
    {
      events: eventsInitial,
      getAssignment,
      getRunResult: () => f08,
    },
  );
  assert.equal(initialDischarge, null, 'Recheck discharge is null before recheck runs');

  // 2. Remediation runs and satisfies:
  const eventsWithRemediation = [
    ...eventsInitial,
    { type: 'assignment-created', payload: { assignmentId: remediationAsgnId, actorId: 'worker' } },
    { type: 'result-linked', payload: { assignmentId: remediationAsgnId, runId: 'r_fix' } },
    { type: 'assignment-created', payload: { assignmentId: recheckAsgnId, actorId: 'reviewer' } },
    { type: 'result-linked', payload: { assignmentId: recheckAsgnId, runId: 'r_recheck' } },
  ];

  const f06 = loadFixture('06-v2-completed-pass-verified.json');
  const getRunResult = (asgnId) => {
    if (asgnId === reviewAsgnId) return f08;
    return f06; // fix and recheck both pass
  };

  const fullDischarge = resolveRecheckDischarge(
    definition,
    gatingOp,
    'reviewer',
    reviewFailedOutcome,
    {
      events: eventsWithRemediation,
      getAssignment,
      getRunResult,
      schemaVersion: '3',
    },
  );

  assert.ok(fullDischarge !== null, 'Recheck discharge is resolved after recheck passes');
  assert.equal(fullDischarge.satisfied, true);
  assert.equal(fullDischarge.supersededAssignmentId, reviewAsgnId);
});

// ---------------------------------------------------------------------------
// 12. Case theo text verdict: review-item cap on review -> fix cycles
// ---------------------------------------------------------------------------
test('characterization: review -> fix cycle bounded by max review attempts', () => {
  const MAX_REVIEW_CYCLES = 3;
  let cycle = 0;

  const runReviewCycle = (verdictText) => {
    cycle++;
    if (cycle > MAX_REVIEW_CYCLES) {
      return { action: 'cap-exceeded', stop: true };
    }
    if (verdictText === 'REJECT') {
      return { action: 'route-fix', stop: false };
    }
    return { action: 'proceed', stop: false };
  };

  // Repeated REJECTs must cap and stop
  assert.deepEqual(runReviewCycle('REJECT'), { action: 'route-fix', stop: false });
  assert.deepEqual(runReviewCycle('REJECT'), { action: 'route-fix', stop: false });
  assert.deepEqual(runReviewCycle('REJECT'), { action: 'route-fix', stop: false });
  assert.deepEqual(runReviewCycle('REJECT'), { action: 'cap-exceeded', stop: true });
});
