import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import {
  createMission,
  getMission,
  listMissions,
  readThreadMessages,
  createMissionAssignment,
  runMissionAssignment,
  synthesizeMission,
} from '../../src/runner/dispatch/mission-lite.mjs';
import { buildAssignment, renderAssignmentPrompt } from '../../src/runner/dispatch/assignment.mjs';
import { initStore, listWork } from '../../src/state/store.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-mission-lite-test-'));
}

test('mission-lite creates mission/thread storage', () => {
  const tempDir = mkTempDir();

  const mission = createMission(
    {
      missionId: 'mission_test_001',
      objective: 'Should planning validation run as a reviewer Assignment?',
      mode: 'debate',
    },
    { cwd: tempDir },
  );

  assert.equal(mission.missionId, 'mission_test_001');
  assert.equal(mission.objective, 'Should planning validation run as a reviewer Assignment?');
  assert.equal(mission.status, 'open');

  const missionDir = path.join(tempDir, '.fgos', 'missions', 'mission_test_001');
  assert.ok(fs.existsSync(path.join(missionDir, 'mission.json')));
  assert.ok(fs.existsSync(path.join(missionDir, 'thread.jsonl')));
  assert.ok(fs.existsSync(path.join(missionDir, 'assignments')));
  assert.ok(fs.existsSync(path.join(missionDir, 'results')));

  const fetched = getMission('mission_test_001', { cwd: tempDir });
  assert.equal(fetched.missionId, 'mission_test_001');

  const allMissions = listMissions({ cwd: tempDir });
  assert.equal(allMissions.length, 1);
  assert.equal(allMissions[0].missionId, 'mission_test_001');
});

test('workId:null assignment works for read-only operation in mission-lite', async () => {
  const tempDir = mkTempDir();

  createMission(
    {
      missionId: 'mission_asgn_test',
      objective: 'Evaluate reviewer assignment for planning validation.',
    },
    { cwd: tempDir },
  );

  const executorScript = path.join(tempDir, 'mock-researcher.mjs');
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const cwd = process.cwd();
    const asgnDir = path.join(cwd, '.fgos', 'assignments');
    if (fs.existsSync(asgnDir)) {
      for (const a of fs.readdirSync(asgnDir)) {
        const runDir = path.join(asgnDir, a, 'runs', '01');
        if (fs.existsSync(runDir)) {
          fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Background Brief\\nFound existing code paths.\\n');
          fs.writeFileSync(
            path.join(runDir, 'agent-result.json'),
            JSON.stringify({ status: 'done', summary: 'Background evidence gathered', evidenceRefs: ['docs/architect/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md'] })
          );
        }
      }
    }
    process.exit(0);
    `,
  );

  const runnerConfig = {
    executor: { command: process.execPath, args: [executorScript, '{prompt}'], allowCrossProvider: true },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const assignment = createMissionAssignment(
    {
      missionId: 'mission_asgn_test',
      role: 'researcher',
      objective: 'Gather facts and existing code paths for planning validation.',
    },
    { cwd: tempDir },
  );

  assert.equal(assignment.workId, null);
  assert.equal(assignment.role, 'researcher');
  // ADR-006 R8: createMissionAssignment builds an inline contract -- no
  // stage/operation on the resulting Assignment, and no missionId field
  // either (inline Assignments are mission-agnostic at the object level;
  // the mission association lives entirely in mission-lite's own
  // thread.jsonl/mission.json bookkeeping).
  assert.equal(assignment.provenance.kind, 'inline');
  assert.equal(assignment.stage, undefined);
  assert.equal(assignment.operation, undefined);
  assert.equal(assignment.missionId, undefined);
  assert.equal(assignment.mutation, 'read-only');

  // ADR-006 R8: the canonical copy exists immediately at creation time --
  // this is the ONLY place the assignment is written, no mission-scoped
  // duplicate under .fgos/missions/<id>/assignments/.
  const canonicalAssignmentFile = path.join(
    tempDir,
    '.fgos',
    'assignments',
    assignment.assignmentId,
    'assignment.json',
  );
  assert.ok(fs.existsSync(canonicalAssignmentFile));
  const missionAssignmentFile = path.join(
    tempDir,
    '.fgos',
    'missions',
    'mission_asgn_test',
    'assignments',
    `${assignment.assignmentId}.json`,
  );
  assert.ok(!fs.existsSync(missionAssignmentFile));

  const result = await runMissionAssignment('mission_asgn_test', assignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
  });

  assert.equal(result.status, 'done');
  assert.equal(result.confidence, 'reported');
  assert.equal(result.workId, null);

  // ADR-006 R8: no full result.json copy under .fgos/missions/<id>/results/
  // anymore -- the canonical result lives under .fgos/assignments/.
  const missionResultFile = path.join(
    tempDir,
    '.fgos',
    'missions',
    'mission_asgn_test',
    'results',
    `${assignment.assignmentId}.json`,
  );
  assert.ok(!fs.existsSync(missionResultFile));

  const threadMsgs = readThreadMessages('mission_asgn_test', { cwd: tempDir });
  assert.equal(threadMsgs.length, 2);
  assert.equal(threadMsgs[0].type, 'TASK');
  assert.equal(threadMsgs[1].type, 'RESULT');
  assert.ok(threadMsgs[1].resultRef.startsWith(`assignments/${assignment.assignmentId}/runs/`));
  assert.ok(threadMsgs[1].resultRef.endsWith('/result.json'));
  const canonicalResultFile = path.join(tempDir, '.fgos', threadMsgs[1].resultRef);
  assert.ok(fs.existsSync(canonicalResultFile));
});

test('runMissionAssignment by string ID fails closed (refuses, does not silently succeed) for an inline assignment.json with mutation stripped -- inline has no operation to backfill mutation from, unlike the declared shape', async () => {
  const tempDir = mkTempDir();

  createMission(
    {
      missionId: 'mission_legacy_string_id_test',
      objective: 'Evaluate reviewer assignment for planning validation.',
    },
    { cwd: tempDir },
  );

  const assignment = createMissionAssignment(
    {
      missionId: 'mission_legacy_string_id_test',
      role: 'researcher',
      objective: 'Gather facts and existing code paths for planning validation.',
    },
    { cwd: tempDir },
  );

  assert.equal(assignment.mutation, 'read-only');
  assert.equal(assignment.operation, undefined);

  // Unlike the DECLARED shape's real "assignment.json persisted before
  // ADR-006 R2 added the mutation stamp" migration scenario (ADR-006 R7)
  // -- no historical inline assignment.json ever existed without
  // `mutation` stamped (execution-contract.mjs requires it at build time,
  // day one). This simulates CORRUPTION instead: tamper the canonical
  // assignment.json directly (the only place it is ever written, ADR-006
  // R8) and confirm the string-ID path fails CLOSED rather than silently
  // treating an unknown-mutation Assignment as read-only.
  const canonicalAssignmentFile = path.join(
    tempDir,
    '.fgos',
    'assignments',
    assignment.assignmentId,
    'assignment.json',
  );
  const corruptedAssignment = JSON.parse(fs.readFileSync(canonicalAssignmentFile, 'utf8'));
  delete corruptedAssignment.mutation;
  delete corruptedAssignment.evidence;
  fs.writeFileSync(canonicalAssignmentFile, `${JSON.stringify(corruptedAssignment, null, 2)}\n`);

  await assert.rejects(
    () =>
      runMissionAssignment('mission_legacy_string_id_test', assignment.assignmentId, {
        cwd: tempDir,
        repoRoot: tempDir,
      }),
    (err) => {
      assert.match(err.message, /mission-lite is strictly read-only/i);
      return true;
    },
  );
});

test('validateAssignmentLegality accepts an inline Assignment (skips the declared-operation check) but still enforces the mission-lite read-only refusal gate -- proven at the root-cause location inside executeAssignment itself, not just mission-lite.mjs\'s own local pre-check', async () => {
  const tempDir = mkTempDir();

  createMission(
    {
      missionId: 'mission_shadow_file_test',
      objective: 'Evaluate reviewer assignment for planning validation.',
    },
    { cwd: tempDir },
  );

  // The in-memory assignment object is built fresh, correctly stamped
  // (mutation: 'read-only', provenance.kind: 'inline'), and NEVER touched
  // by this test -- mission-lite.mjs's own local pre-check will see it as
  // clean and NOT throw locally.
  const assignment = createMissionAssignment(
    {
      missionId: 'mission_shadow_file_test',
      role: 'researcher',
      objective: 'Gather facts and existing code paths for planning validation.',
    },
    { cwd: tempDir },
  );
  assert.equal(assignment.mutation, 'read-only');
  assert.equal(assignment.provenance.kind, 'inline');
  assert.equal(assignment.stage, undefined);
  assert.equal(assignment.operation, undefined);

  // Tamper the CANONICAL copy directly (the only place it is ever written,
  // ADR-006 R8) to mutation: 'mutating' -- structurally impossible to
  // produce via buildAssignment()/buildInlineAssignment itself
  // (execution-contract.mjs rejects mutation: 'mutating' at build time,
  // ADR-006 §6), but a real defense-in-depth scenario: an externally
  // tampered assignment.json that never actually went through the builder.
  // This mirrors the earlier "stale shadow file" scenario, except
  // the shadow copy here carries an EXPLICIT mutating value rather than a
  // missing field, since a missing field on an inline assignment is a
  // different (and, per the test above, also-refused) case.
  const shadowPath = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'assignment.json');
  const shadowAssignment = { ...assignment, mutation: 'mutating' };
  fs.writeFileSync(shadowPath, `${JSON.stringify(shadowAssignment, null, 2)}\n`);

  // Called with the OBJECT form (not string) -- mission-lite.mjs's own
  // local gate check passes (it sees the clean in-memory object). Only
  // executeAssignment's own internal effectiveAssignment re-read (which
  // discards the caller's object and re-reads the tampered shadow file the
  // moment assignment.json already exists on disk) can catch this -- and
  // it must, via validateAssignmentLegality's SECOND call on
  // effectiveAssignment. This also proves the inline branch genuinely
  // skips the declared-operation check (no "unknown operation" error) while
  // the mission-refusal gate still fires unconditionally for it.
  await assert.rejects(
    () =>
      runMissionAssignment('mission_shadow_file_test', assignment, {
        cwd: tempDir,
        repoRoot: tempDir,
      }),
    (err) => {
      assert.match(err.message, /mission-lite is strictly read-only/i);
      assert.doesNotMatch(err.message, /unknown operation/i);
      return true;
    },
  );
});

test('mission-lite cannot create a mutating assignment: createMissionAssignment always builds a read-only inline contract regardless of role, and the underlying execution-contract validator independently rejects mutation at build time (ADR-006 R8)', () => {
  const tempDir = mkTempDir();

  createMission(
    {
      missionId: 'mission_refuse_test',
      objective: 'Read-only mission check.',
    },
    { cwd: tempDir },
  );

  // createMissionAssignment's public signature has no operation/mutation
  // parameter at all (ADR-006 R8) -- even a role historically associated
  // with a mutating declared operation (e.g. 'implementer') always yields
  // a read-only inline contract; there is no way for a caller to request
  // otherwise through this function.
  const assignment = createMissionAssignment(
    {
      missionId: 'mission_refuse_test',
      role: 'implementer',
      objective: 'Attempt mutating-flavored role assignment in mission-lite.',
    },
    { cwd: tempDir },
  );
  assert.equal(assignment.mutation, 'read-only');
  assert.equal(assignment.provenance.inline.contract.mutation, 'read-only');

  // Defense-in-depth, traced directly (per the CRITICAL SAFETY CONSTRAINT):
  // even a hand-constructed inline contract that explicitly requests
  // mutation is rejected at build time by execution-contract.mjs (ADR-006
  // §6) -- mission-lite's own local isReadOnlyAssignment check
  // inside createMissionAssignment can never actually fire for a mutating
  // inline contract, because buildAssignment() itself already refuses to
  // construct one.
  assert.throws(
    () =>
      buildAssignment({
        workId: null,
        provenance: {
          kind: 'inline',
          contract: {
            objective: 'Attempt mutating operation in mission-lite.',
            contextRefs: [],
            constraints: [],
            expectedOutputs: ['agent-result.json (status, summary)'],
            mutation: 'mutating',
            evidence: { required: 'reported' },
            role: 'implementer',
            budget: { timeoutMs: 5000, maxRuns: 1 },
          },
          caller: { writerId: 'test-writer' },
        },
      }),
    (err) => {
      assert.match(err.message, /read-only only|rejected/i);
      return true;
    },
  );
});

test('no Work item is created or modified during mission-lite execution', async () => {
  const tempDir = mkTempDir();
  const fgosDir = path.join(tempDir, '.fgos');

  // Initialize store so .fgos exists with empty work
  initStore(fgosDir);
  const initialWorkList = listWork(fgosDir);
  const initialWorkCount = Object.keys(initialWorkList.work).length;

  const mission = createMission(
    {
      missionId: 'mission_no_work_mutation',
      objective: 'Should planning validation run as reviewer Assignment?',
    },
    { cwd: tempDir },
  );

  const executorScript = path.join(tempDir, 'read-only-worker.mjs');
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const cwd = process.cwd();
    const asgnDir = path.join(cwd, '.fgos', 'assignments');
    if (fs.existsSync(asgnDir)) {
      for (const a of fs.readdirSync(asgnDir)) {
        const runDir = path.join(asgnDir, a, 'runs', '01');
        if (fs.existsSync(runDir)) {
          fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nAnalysis complete.\\n');
          fs.writeFileSync(
            path.join(runDir, 'agent-result.json'),
            JSON.stringify({ status: 'done', summary: 'Read-only debate finding', evidenceRefs: ['docs/architect/agent-coordination/proposals/step-08-standalone-coordination-protocols.md'] })
          );
        }
      }
    }
    process.exit(0);
    `,
  );

  const runnerConfig = {
    executor: { command: process.execPath, args: [executorScript, '{prompt}'], allowCrossProvider: true },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const assignment = createMissionAssignment(
    {
      missionId: mission.missionId,
      role: 'reviewer',
      objective: 'Evaluate risks of reviewer assignment in planning stage.',
    },
    { cwd: tempDir },
  );

  await runMissionAssignment(mission.missionId, assignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
  });

  synthesizeMission(
    mission.missionId,
    {
      decisionRecommendation: 'Keep planning validation as direct validation until executing stage adoption is stable.',
      tradeoffs: 'Reviewer assignments add coordination overhead for early planning.',
      risks: 'Premature reviewer assignment adds latency before execution model is proven.',
      recommendedWorkItem: {
        title: 'Adopt executing-stage reviewer assignment before migrating planning validation',
        verify: 'node --test test/runner/assignment-dispatch.test.mjs',
        description: 'Verify evidence hardening in executing stage before adopting reviewer assignment for planning.',
      },
    },
    { cwd: tempDir },
  );

  // Assert store work list is completely unchanged
  const postWorkList = listWork(fgosDir);
  assert.equal(Object.keys(postWorkList.work).length, initialWorkCount);
  assert.deepEqual(postWorkList.work, initialWorkList.work);
});

test('no-evidence role result is not treated as consensus and synthesis cites role result refs', async () => {
  const tempDir = mkTempDir();

  createMission(
    {
      missionId: 'mission_no_evidence_test',
      objective: 'Debate planning validation role adoption.',
    },
    { cwd: tempDir },
  );

  // Worker 1: researcher returns valid report
  const researcherScript = path.join(tempDir, 'researcher.mjs');
  fs.writeFileSync(
    researcherScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const cwd = process.cwd();
    const asgnDir = path.join(cwd, '.fgos', 'assignments');
    if (fs.existsSync(asgnDir)) {
      for (const a of fs.readdirSync(asgnDir)) {
        const runDir = path.join(asgnDir, a, 'runs', '01');
        if (fs.existsSync(runDir)) {
          fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Research\\nDocs reviewed.\\n');
          fs.writeFileSync(
            path.join(runDir, 'agent-result.json'),
            JSON.stringify({ status: 'done', summary: 'Prior docs favor waiting for executing stability.', evidenceRefs: ['docs/architect/agent-coordination/proposals/step-08-standalone-coordination-protocols.md'] })
          );
        }
      }
    }
    process.exit(0);
    `,
  );

  // Worker 2: reviewer exits zero with NO artifacts => produces no-evidence
  const reviewerScript = path.join(tempDir, 'reviewer.mjs');
  fs.writeFileSync(reviewerScript, 'process.exit(0);');

  const asgnResearcher = createMissionAssignment(
    {
      missionId: 'mission_no_evidence_test',
      role: 'researcher',
      objective: 'Gather background facts.',
    },
    { cwd: tempDir },
  );

  const asgnReviewer = createMissionAssignment(
    {
      missionId: 'mission_no_evidence_test',
      role: 'reviewer',
      objective: 'Analyze risks.',
    },
    { cwd: tempDir },
  );

  await runMissionAssignment('mission_no_evidence_test', asgnResearcher, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig: {
      executor: { command: process.execPath, args: [researcherScript, '{prompt}'], allowCrossProvider: true },
      models: { standard: 'test-model' },
      timeoutMs: 5000,
    },
  });

  const reviewerRes = await runMissionAssignment('mission_no_evidence_test', asgnReviewer, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig: {
      executor: { command: process.execPath, args: [reviewerScript, '{prompt}'], allowCrossProvider: true },
      models: { standard: 'test-model' },
      timeoutMs: 5000,
    },
  });

  assert.equal(reviewerRes.status, 'no-evidence');
  assert.equal(reviewerRes.confidence, 'no-evidence');

  const synth = synthesizeMission(
    'mission_no_evidence_test',
    {
      decisionRecommendation: 'Stay as direct validation until executing stage adoption is stable.',
      tradeoffs: 'Direct validation avoids overhead while executing stage protocol is hardened.',
      risks: 'Reviewer feedback is delayed until executing stage.',
      recommendedWorkItem: {
        title: 'De-risk executing-stage reviewer assignment before planning migration',
        verify: 'node --test test/runner/assignment-dispatch.test.mjs',
        description: 'Harden executing stage reviewer assignment evidence.',
      },
    },
    { cwd: tempDir },
  );

  // Assert synthesis cites role result refs (ADR-006 R8: canonical
  // assignments/<id>/runs/<NN>/result.json reference, not a mission-scoped
  // results/<id>.json copy).
  assert.ok(synth.synthesisContent.includes(`assignments/${asgnResearcher.assignmentId}/runs/`));
  assert.ok(synth.synthesisContent.includes(`assignments/${asgnReviewer.assignmentId}/runs/`));

  // Assert no-evidence role result is marked UNSUPPORTED / NO EVIDENCE and not treated as consensus
  assert.ok(synth.synthesisContent.includes('UNSUPPORTED / NO EVIDENCE'));
  assert.ok(synth.synthesisContent.includes('Caution: Results from role(s) [reviewer] produced no-evidence'));
});

test('first business case debate mission runs with three role assignments and produces structured synthesis', async () => {
  const tempDir = mkTempDir();

  const firstBusinessCaseQuestion =
    'Should coding-domain planning validation run as a reviewer Assignment, or stay as direct same-session validation until executing-stage adoption is stable?';

  const mission = createMission(
    {
      missionId: 'mission_first_business_case_001',
      objective: firstBusinessCaseQuestion,
      mode: 'debate',
    },
    { cwd: tempDir },
  );

  // Mock executor that responds appropriately for each role assignment
  const debateExecutorScript = path.join(tempDir, 'debate-worker.mjs');
  fs.writeFileSync(
    debateExecutorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const cwd = process.cwd();
    const asgnDir = path.join(cwd, '.fgos', 'assignments');
    if (fs.existsSync(asgnDir)) {
      for (const a of fs.readdirSync(asgnDir)) {
        const runDir = path.join(asgnDir, a, 'runs', '01');
        if (fs.existsSync(runDir)) {
          const asgnJson = JSON.parse(fs.readFileSync(path.join(cwd, '.fgos', 'assignments', a, 'assignment.json'), 'utf8'));
          let summaryText = 'Role finding';
          if (asgnJson.role === 'researcher') {
            summaryText = 'Step 05 operation choice and Step 06 Work-attached read-only operations are complete.';
          } else if (asgnJson.role === 'advisor') {
            summaryText = 'Direct same-session validation minimizes friction while executing-stage adoption stabilizes.';
          } else if (asgnJson.role === 'reviewer') {
            summaryText = 'Reviewer Assignment in planning adds lifecycle overhead before evidence protocol is proven in executing stage.';
          }
          fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Role Report\\n' + summaryText + '\\n');
          fs.writeFileSync(
            path.join(runDir, 'agent-result.json'),
            JSON.stringify({ status: 'done', summary: summaryText, evidenceRefs: ['docs/architect/agent-coordination/proposals/step-08-standalone-coordination-protocols.md'] })
          );
        }
      }
    }
    process.exit(0);
    `,
  );

  const runnerConfig = {
    executor: { command: process.execPath, args: [debateExecutorScript, '{prompt}'], allowCrossProvider: true },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  // Role 1: researcher (background-brief)
  const asgnResearch = createMissionAssignment(
    {
      missionId: mission.missionId,
      role: 'researcher',
      objective: 'Gather facts on current stage operations and Work-attached read-only adoption.',
    },
    { cwd: tempDir },
  );

  // Role 2: advisor (argument-for direct validation)
  const asgnAdvisor = createMissionAssignment(
    {
      missionId: mission.missionId,
      role: 'advisor',
      objective: 'Make the best case for staying as direct same-session validation.',
    },
    { cwd: tempDir },
  );

  // Role 3: reviewer (argument-against premature planning reviewer assignment)
  const asgnReviewer = createMissionAssignment(
    {
      missionId: mission.missionId,
      role: 'reviewer',
      objective: 'Evaluate risks and contradictions of adopting reviewer Assignment in planning stage.',
    },
    { cwd: tempDir },
  );

  const res1 = await runMissionAssignment(mission.missionId, asgnResearch, { cwd: tempDir, repoRoot: tempDir, runnerConfig });
  const res2 = await runMissionAssignment(mission.missionId, asgnAdvisor, { cwd: tempDir, repoRoot: tempDir, runnerConfig });
  const res3 = await runMissionAssignment(mission.missionId, asgnReviewer, { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  assert.equal(res1.status, 'done');
  assert.equal(res2.status, 'done');
  assert.equal(res3.status, 'done');

  const synthResult = synthesizeMission(
    mission.missionId,
    {
      decisionRecommendation:
        'Coding-domain planning validation should stay as direct same-session validation until executing-stage adoption is stable.',
      tradeoffs:
        'Direct same-session validation keeps planning fast and avoids extra assignment turns, but defers independent reviewer validation until executing stage.',
      risks:
        'Prematurely forcing reviewer Assignment in planning adds overhead before role coordination is fully proven in executing stage.',
      recommendedWorkItem: {
        title: 'Harden executing-stage reviewer assignment protocol before planning adoption',
        verify: 'node --test test/runner/assignment-dispatch.test.mjs',
        description:
          'Validate evidence hardening and role coordination in executing stage before adopting reviewer assignment for planning validation.',
        kind: 'task',
        risk: 'standard',
      },
    },
    { cwd: tempDir },
  );

  const updatedMission = getMission(mission.missionId, { cwd: tempDir });
  assert.equal(updatedMission.status, 'completed');

  assert.ok(fs.existsSync(synthResult.synthesisPath));

  // Verify synthesis sections
  const content = synthResult.synthesisContent;
  assert.ok(content.includes('# Mission Synthesis'));
  assert.ok(content.includes('## Question'));
  assert.ok(content.includes('## Inputs'));
  assert.ok(content.includes(`assignments/${asgnResearch.assignmentId}/runs/`));
  assert.ok(content.includes(`assignments/${asgnAdvisor.assignmentId}/runs/`));
  assert.ok(content.includes(`assignments/${asgnReviewer.assignmentId}/runs/`));
  assert.ok(content.includes('## Decision Recommendation'));
  assert.ok(content.includes('## Tradeoffs'));
  assert.ok(content.includes('## Risks'));
  assert.ok(content.includes('## Recommended Work Item'));
  assert.ok(content.includes('Harden executing-stage reviewer assignment protocol before planning adoption'));
  assert.ok(content.includes('## Evidence Quality'));
});

test('renderAssignmentPrompt renders a clean prompt for a mission-lite inline Assignment -- no "Stage operation: undefined.undefined" / "Task-spec: .../undefined.md" garbage (ADR-006 R8 companion fix)', () => {
  const tempDir = mkTempDir();

  createMission(
    { missionId: 'mission_prompt_test', objective: 'Probe inline prompt rendering.' },
    { cwd: tempDir },
  );

  const assignment = createMissionAssignment(
    {
      missionId: 'mission_prompt_test',
      role: 'researcher',
      objective: 'Gather background facts for prompt-rendering probe.',
      contextRefs: ['docs/architect/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md'],
    },
    { cwd: tempDir },
  );

  const prompt = renderAssignmentPrompt(assignment, { cwd: tempDir });

  assert.ok(prompt.includes(`Assignment: ${assignment.assignmentId}`));
  assert.ok(prompt.includes('Role: researcher'));
  assert.ok(prompt.includes('Objective: Gather background facts for prompt-rendering probe.'));
  assert.ok(!prompt.includes('undefined'));
  assert.ok(!prompt.includes('Stage operation:'));
  assert.ok(!prompt.includes('Task-spec:'));
});

test('runMissionAssignment (object form) refuses an Assignment that belongs to a different mission', async () => {
  const tempDir = mkTempDir();

  createMission(
    { missionId: 'mission_aaa', objective: 'Mission A: evaluate one thing.' },
    { cwd: tempDir },
  );
  createMission(
    { missionId: 'mission_bbb', objective: 'Mission B: evaluate a different thing.' },
    { cwd: tempDir },
  );

  // A genuinely read-only Assignment created for mission_bbb.
  const assignmentB = createMissionAssignment(
    {
      missionId: 'mission_bbb',
      role: 'researcher',
      objective: 'Gather facts scoped to mission B only.',
    },
    { cwd: tempDir },
  );
  assert.equal(assignmentB.mutation, 'read-only');

  // Object-form call, mission_aaa handed mission_bbb's own Assignment
  // object -- must be refused exactly like the string-ID form already is,
  // not silently executed under the wrong mission's thread.
  await assert.rejects(
    () =>
      runMissionAssignment('mission_aaa', assignmentB, {
        cwd: tempDir,
        repoRoot: tempDir,
      }),
    (err) => {
      assert.match(err.message, /not found in mission "mission_aaa"/i);
      return true;
    },
  );

  // No orphaned RESULT entry should land in mission_aaa's own thread.
  const threadMsgsA = readThreadMessages('mission_aaa', { cwd: tempDir });
  assert.equal(threadMsgsA.length, 0);
});

test('createMissionAssignment never lets two concurrent callers under the same writer identity collide on the same assignmentId or silently drop one caller\'s real content', async () => {
  const tempDir = mkTempDir();
  const missionId = 'mission_race_test';
  createMission({ missionId, objective: 'Should we pick option A or option B?' }, { cwd: tempDir });

  // Two genuine OS threads, each importing mission-lite.mjs independently,
  // call createMissionAssignment for the same mission/writer identity. Each
  // worker patches its OWN thread-local `fs.mkdirSync` to pause (via a
  // shared Atomics barrier) the first time it is called -- that call site
  // (mission-lite.mjs, right after the assignmentId candidate is computed,
  // right before it is claimed on disk) is the exact TOCTOU window this
  // fix closes. Pausing there -- instead of only synchronizing worker
  // start time -- guarantees both threads compute their assignmentId
  // candidate against the same not-yet-mutated directory state regardless
  // of OS thread-scheduling timing, so the race reproduces deterministically
  // rather than depending on scheduling luck.
  const missionLiteUrl = new URL('../../src/runner/dispatch/mission-lite.mjs', import.meta.url).href;
  const workerSource = `
import fs from 'node:fs';
import { parentPort, workerData } from 'node:worker_threads';
import { createMissionAssignment } from ${JSON.stringify(missionLiteUrl)};

const { cwd, missionId, role, objective, sab, readyIndex, barrierIndex } = workerData;
const flags = new Int32Array(sab);

const realMkdirSync = fs.mkdirSync.bind(fs);
let pausedOnce = false;
fs.mkdirSync = (...args) => {
  if (!pausedOnce) {
    pausedOnce = true;
    Atomics.add(flags, readyIndex, 1);
    Atomics.wait(flags, barrierIndex, 0);
  }
  return realMkdirSync(...args);
};

try {
  const assignment = createMissionAssignment({ missionId, role, objective }, { cwd });
  parentPort.postMessage({
    ok: true,
    assignmentId: assignment.assignmentId,
    role: assignment.role,
    objective: assignment.objective,
  });
} catch (err) {
  parentPort.postMessage({ ok: false, error: err.message });
}
`;
  const workerFile = path.join(tempDir, 'assignment-race-worker.mjs');
  fs.writeFileSync(workerFile, workerSource);

  const READY_INDEX = 0;
  const BARRIER_INDEX = 1;
  const sab = new SharedArrayBuffer(8);
  const flags = new Int32Array(sab);

  function spawnWorker(role, objective) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(workerFile, {
        workerData: { cwd: tempDir, missionId, role, objective, sab, readyIndex: READY_INDEX, barrierIndex: BARRIER_INDEX },
      });
      worker.once('message', (msg) => {
        worker.terminate().then(() => resolve(msg), reject);
      });
      worker.once('error', reject);
    });
  }

  const resultsPromise = Promise.all([
    spawnWorker('researcher', 'Investigate option A'),
    spawnWorker('reviewer', 'Investigate option B'),
  ]);

  // Release the barrier once both workers have paused inside their own
  // patched `fs.mkdirSync` (i.e. both already computed an assignmentId
  // candidate against the same directory state), so both proceed to claim
  // it on disk at effectively the same instant.
  const readyDeadline = Date.now() + 5000;
  while (Atomics.load(flags, READY_INDEX) < 2) {
    if (Date.now() > readyDeadline) {
      throw new Error('race-repro workers did not both become ready in time');
    }
    await new Promise((resolve) => setTimeout(resolve, 1));
  }
  Atomics.store(flags, BARRIER_INDEX, 1);
  Atomics.notify(flags, BARRIER_INDEX);

  const [resultA, resultB] = await resultsPromise;

  assert.ok(resultA.ok, `researcher worker failed: ${resultA.error}`);
  assert.ok(resultB.ok, `reviewer worker failed: ${resultB.error}`);

  // The race must be closed, not just made less likely: two concurrent
  // creators must never be handed the same assignmentId.
  assert.notEqual(
    resultA.assignmentId,
    resultB.assignmentId,
    'two concurrent createMissionAssignment calls returned the same assignmentId',
  );

  // Every successful caller's returned Assignment must match what is
  // actually persisted on disk -- no silent content divergence between the
  // in-memory return value and the canonical assignment.json.
  for (const result of [resultA, resultB]) {
    const onDiskPath = path.join(tempDir, '.fgos', 'assignments', result.assignmentId, 'assignment.json');
    const onDisk = JSON.parse(fs.readFileSync(onDiskPath, 'utf8'));
    assert.equal(onDisk.role, result.role);
    assert.equal(onDisk.objective, result.objective);
  }

  // thread.jsonl must carry exactly one TASK message per assignmentId, each
  // consistent with what was actually persisted -- never two TASK messages
  // sharing one assignmentId with contradictory content.
  const threadMsgs = readThreadMessages(missionId, { cwd: tempDir });
  const taskMsgs = threadMsgs.filter((m) => m.type === 'TASK');
  assert.equal(taskMsgs.length, 2);
  assert.equal(new Set(taskMsgs.map((m) => m.assignmentId)).size, 2);
});
