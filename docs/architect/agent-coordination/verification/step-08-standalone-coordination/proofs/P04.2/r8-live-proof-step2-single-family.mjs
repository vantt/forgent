// R8 live proof Step 2 (standalone, isolated from Step 0/1 to keep run
// time bounded): single-family (claude explicitly pinned for BOTH
// branches) live proof of the fan-out/isolation/synthesis MECHANICS,
// honestly separate from R8's own 2-provider-family requirement (already
// closed as a stop gate by r8-live-proof-driver.mjs's Step 0/1).
//
// Run: node r8-live-proof-step2-single-family.mjs

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDeclaredProtocolSession, dispatchDeclaredOperation, synthesizeResearchFanIn } from '../../../../../../../src/runner/coordination/session-engine.mjs';
import { readManifest } from '../../../../../../../src/runner/coordination/store.mjs';

const REPO_ROOT = path.resolve(fileURLToPath(new URL('../../../../../../../', import.meta.url)));
const realConfig = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.fgos', 'config.json'), 'utf8'));
const runnerConfig = realConfig.runner ?? realConfig;
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-r8-step2-'));
console.log('Workspace:', tempDir);

const coordinationId = 'coord_r8_step2_single_family';
openDeclaredProtocolSession(
  {
    definitionId: 'core.coordination-protocol.independent-research-fan-out-fan-in',
    coordinationId,
    objective: 'R8 mechanics proof: fan-out/isolation/synthesis, both branches pinned to the one genuinely reachable family (claude).',
    writerId: 'r8-proof-driver-step2',
  },
  { cwd: tempDir, packageRoot: REPO_ROOT },
);
const coordDispatch = await dispatchDeclaredOperation(
  coordinationId,
  { operationId: 'dispatch-research', objective: 'Fan out two independent, bounded research questions.', expectedOutputs: ['agent-result.json (status, summary)'], writerId: 'r8-proof-driver-step2', cliPolicy: { preferExecutor: 'claude', minTier: 'lightweight' } },
  { cwd: tempDir, repoRoot: tempDir, packageRoot: REPO_ROOT, runnerConfig, timeoutMs: 90000 },
);
console.log('Coordinator dispatch-research settled:', coordDispatch.runResult.status, coordDispatch.runResult.confidence);

const start = Date.now();
const settled = await Promise.allSettled([
  dispatchDeclaredOperation(
    coordinationId,
    {
      operationId: 'independent-research',
      targetActorId: 'researcher-a',
      objective: 'Read-only, bounded: in one sentence, what does 2+2 equal?',
      expectedOutputs: ['agent-result.json (status, summary)'],
      writerId: 'r8-proof-driver-step2',
      fromAssignmentId: coordDispatch.assignment.assignmentId,
      taskKey: 'research-branch:researcher-a',
      cliPolicy: { preferExecutor: 'claude', minTier: 'lightweight' },
    },
    { cwd: tempDir, repoRoot: tempDir, packageRoot: REPO_ROOT, runnerConfig, timeoutMs: 90000 },
  ),
  dispatchDeclaredOperation(
    coordinationId,
    {
      operationId: 'independent-research',
      targetActorId: 'researcher-b',
      objective: 'Read-only, bounded: in one sentence, what does 3+3 equal?',
      expectedOutputs: ['agent-result.json (status, summary)'],
      writerId: 'r8-proof-driver-step2',
      fromAssignmentId: coordDispatch.assignment.assignmentId,
      taskKey: 'research-branch:researcher-b',
      cliPolicy: { preferExecutor: 'claude', minTier: 'lightweight' },
    },
    { cwd: tempDir, repoRoot: tempDir, packageRoot: REPO_ROOT, runnerConfig, timeoutMs: 90000 },
  ),
]);
const elapsedMs = Date.now() - start;
console.log(`Both branches dispatched via ONE Promise.allSettled batch; total wall time: ${elapsedMs}ms.`);

for (const [i, outcome] of settled.entries()) {
  const actorId = i === 0 ? 'researcher-a' : 'researcher-b';
  if (outcome.status === 'fulfilled') {
    const rr = outcome.value.runResult;
    console.log(`  ${actorId}: fulfilled, runResult.status=${rr.status}, confidence=${rr.confidence}, executor=${rr.policy.provenance.executor.value}, provider=${rr.policy.provenance.provider.value}, tier=${rr.policy.provenance.tier.value}`);
    if (rr.agentClaim?.summary) console.log(`    agentClaim.summary: ${String(rr.agentClaim.summary).slice(0, 300)}`);
    console.log(`    contextRefs: ${JSON.stringify(outcome.value.assignment.contextRefs)}`);
  } else {
    console.log(`  ${actorId}: rejected -- ${outcome.reason?.message ?? outcome.reason}`);
  }
}

const synthesis = synthesizeResearchFanIn(coordinationId, { branchActorIds: ['researcher-a', 'researcher-b'], partial: true }, { cwd: tempDir });
console.log('\nSynthesis status:', synthesis.status);
console.log('accepted:', JSON.stringify(synthesis.accepted));
console.log('unverified:', JSON.stringify(synthesis.unverified));
console.log('failed:', JSON.stringify(synthesis.failed));
console.log('missing:', JSON.stringify(synthesis.missing));
console.log('explanation:', synthesis.explanation);

const finalManifest = readManifest(coordinationId, { cwd: tempDir });
console.log('\nassignmentRefs:', finalManifest.assignmentRefs);
console.log('\nWorkspace (for independent inspection):', tempDir);
