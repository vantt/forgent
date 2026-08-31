import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  createMission,
  getMission,
  listMissions,
  readThreadMessages,
  createMissionAssignment,
  runMissionAssignment,
  synthesizeMission,
} from '../../src/runner/dispatch/mission-lite.mjs';
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
      stage: 'planning',
      operation: 'resolve-question',
      role: 'researcher',
      objective: 'Gather facts and existing code paths for planning validation.',
    },
    { cwd: tempDir },
  );

  assert.equal(assignment.workId, null);
  assert.equal(assignment.missionId, 'mission_asgn_test');
  assert.equal(assignment.role, 'researcher');

  const assignmentFile = path.join(
    tempDir,
    '.fgos',
    'missions',
    'mission_asgn_test',
    'assignments',
    `${assignment.assignmentId}.json`,
  );
  assert.ok(fs.existsSync(assignmentFile));

  const result = await runMissionAssignment('mission_asgn_test', assignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
  });

  assert.equal(result.status, 'done');
  assert.equal(result.confidence, 'reported');
  assert.equal(result.workId, null);

  const resultFile = path.join(
    tempDir,
    '.fgos',
    'missions',
    'mission_asgn_test',
    'results',
    `${assignment.assignmentId}.json`,
  );
  assert.ok(fs.existsSync(resultFile));

  const threadMsgs = readThreadMessages('mission_asgn_test', { cwd: tempDir });
  assert.equal(threadMsgs.length, 2);
  assert.equal(threadMsgs[0].type, 'TASK');
  assert.equal(threadMsgs[1].type, 'RESULT');
  assert.equal(threadMsgs[1].resultRef, `results/${assignment.assignmentId}.json`);
});

test('mutating mission-lite assignment is refused', async () => {
  const tempDir = mkTempDir();

  createMission(
    {
      missionId: 'mission_refuse_test',
      objective: 'Read-only mission check.',
    },
    { cwd: tempDir },
  );

  // Creating mutating operation (implement-item) in mission-lite must throw RunnerConfigError
  assert.throws(
    () => {
      createMissionAssignment(
        {
          missionId: 'mission_refuse_test',
          stage: 'executing',
          operation: 'implement-item',
          role: 'implementer',
          objective: 'Attempt mutating operation in mission-lite.',
        },
        { cwd: tempDir },
      );
    },
    (err) => {
      assert.match(err.message, /mission-lite is strictly read-only/i);
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
      stage: 'planning',
      operation: 'validate-plan',
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
      stage: 'planning',
      operation: 'resolve-question',
      role: 'researcher',
      objective: 'Gather background facts.',
    },
    { cwd: tempDir },
  );

  const asgnReviewer = createMissionAssignment(
    {
      missionId: 'mission_no_evidence_test',
      stage: 'planning',
      operation: 'validate-plan',
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

  // Assert synthesis cites role result refs
  assert.ok(synth.synthesisContent.includes(`results/${asgnResearcher.assignmentId}.json`));
  assert.ok(synth.synthesisContent.includes(`results/${asgnReviewer.assignmentId}.json`));

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
      stage: 'planning',
      operation: 'resolve-question',
      role: 'researcher',
      objective: 'Gather facts on current stage operations and Work-attached read-only adoption.',
    },
    { cwd: tempDir },
  );

  // Role 2: advisor (argument-for direct validation)
  const asgnAdvisor = createMissionAssignment(
    {
      missionId: mission.missionId,
      stage: 'planning',
      operation: 'resolve-question',
      role: 'advisor',
      objective: 'Make the best case for staying as direct same-session validation.',
    },
    { cwd: tempDir },
  );

  // Role 3: reviewer (argument-against premature planning reviewer assignment)
  const asgnReviewer = createMissionAssignment(
    {
      missionId: mission.missionId,
      stage: 'planning',
      operation: 'validate-plan',
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
  assert.ok(content.includes(`results/${asgnResearch.assignmentId}.json`));
  assert.ok(content.includes(`results/${asgnAdvisor.assignmentId}.json`));
  assert.ok(content.includes(`results/${asgnReviewer.assignmentId}.json`));
  assert.ok(content.includes('## Decision Recommendation'));
  assert.ok(content.includes('## Tradeoffs'));
  assert.ok(content.includes('## Risks'));
  assert.ok(content.includes('## Recommended Work Item'));
  assert.ok(content.includes('Harden executing-stage reviewer assignment protocol before planning adoption'));
  assert.ok(content.includes('## Evidence Quality'));
});
