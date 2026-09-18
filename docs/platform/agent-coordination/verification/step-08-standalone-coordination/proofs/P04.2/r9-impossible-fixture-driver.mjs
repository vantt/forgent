// R9 proof driver: a fixture whose required provider/tier combination is
// genuinely impossible against the REAL, committed .fgos/config.json --
// proves a named fail-closed explanation with ZERO Assignments launched.
//
// The impossible fixture pins researcher-a's operation to
// `preferExecutor: "agy-cli"` (the real gemini-family executor) with
// `minTier: critical`. The REAL committed config only configures
// `modelPolicies.gemini.lightweight` (no critical/standard/creative/
// analytical entry at all) -- confirmed directly from .fgos/config.json,
// not assumed. This is a genuine provider/tier impossibility, not a
// diversity-count shortfall.
//
// Run: node r9-impossible-fixture-driver.mjs
// Requires no live executor/network access at all -- planCohort fails
// closed on candidate matching alone, before any dispatch is attempted.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDeclaredProtocolSession, dispatchResearchFanOut } from '../../../../../../../src/runner/coordination/session-engine.mjs';
import { readManifest } from '../../../../../../../src/runner/coordination/store.mjs';

const REPO_ROOT = path.resolve(fileURLToPath(new URL('../../../../../../../', import.meta.url)));
const realConfig = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.fgos', 'config.json'), 'utf8'));
const runnerConfig = realConfig.runner ?? realConfig;

console.log('--- Confirming the real committed config genuinely has no critical-tier model for gemini ---');
console.log('modelPolicies.gemini =', JSON.stringify(runnerConfig.modelPolicies.gemini));
console.log('executors["agy-cli"].providerModel =', runnerConfig.executors['agy-cli'].providerModel);

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-r9-impossible-'));
const protocolsDir = path.join(tempDir, '.fgos', 'coordination-protocols');
fs.mkdirSync(protocolsDir, { recursive: true });

const IMPOSSIBLE_FIXTURE = `
apiVersion: fgos.dev/v1alpha1
kind: FlowDefinition
metadata:
  id: proof.coordination-protocol.r9-impossible-tier
  version: 1.0.0
spec:
  profile:
    kind: CoordinationProtocol
    topology:
      contextVisibility: isolated-until-fan-in
      edges:
        - from: coordinator-actor
          to: researcher-a
          intents: [research]
          maxRounds: 1
    cohort:
      distinctProviderFamilies: 1
      independence: isolated-until-fan-in
  roles: [coordinator, researcher]
  actors:
    - id: coordinator-actor
      role: coordinator
    - id: researcher-a
      role: researcher
  operations:
    - id: dispatch-research
      role: coordinator
      task:
        contractTemplate: research-fanout-dispatch
      result:
        kind: advisory
        evidenceRequired: reported
    - id: impossible-research
      role: researcher
      policy:
        minTier: critical
        preferExecutor: agy-cli
      task:
        contractTemplate: independent-research-brief
      result:
        kind: advisory
        evidenceRequired: verified
  graph:
    entry: phase-fan-out
    nodes:
      - id: phase-fan-out
        operations:
          - ref: dispatch-research
            actor: coordinator-actor
        transitions: [phase-research]
      - id: phase-research
        operations:
          - ref: impossible-research
            actor: researcher-a
        transitions: []
`;
fs.writeFileSync(path.join(protocolsDir, 'r9-impossible-tier.yaml'), IMPOSSIBLE_FIXTURE);

const coordinationId = 'coord_r9_impossible_proof';
const manifest = openDeclaredProtocolSession(
  {
    definitionId: 'proof.coordination-protocol.r9-impossible-tier',
    coordinationId,
    objective: 'R9 proof: an impossible provider/tier combination must launch zero Assignments.',
    writerId: 'r9-proof-driver',
  },
  { cwd: tempDir, packageRoot: REPO_ROOT },
);
console.log('\n--- Session opened, actors bound BEFORE any Assignment ---');
console.log('actors:', manifest.actors.map((a) => a.id));
console.log('assignmentRefs (must be empty):', manifest.assignmentRefs);

console.log('\n--- Calling dispatchResearchFanOut against the impossible fixture ---');
let result;
let threw = null;
try {
  result = await dispatchResearchFanOut(
    coordinationId,
    {
      operationId: 'impossible-research',
      branches: [{ actorId: 'researcher-a', objective: 'Answer a bounded research question.', expectedOutputs: ['agent-result.json (status, summary)'] }],
      writerId: 'r9-proof-driver',
    },
    { cwd: tempDir, repoRoot: tempDir, packageRoot: REPO_ROOT, runnerConfig },
  );
} catch (err) {
  threw = err;
}

if (threw) {
  console.log('\n!!! UNEXPECTED THROW (this proof expects a structured planning-failed result, not an exception):', threw.message);
  process.exitCode = 1;
} else {
  console.log('\n--- Result ---');
  console.log('status:', result.status);
  console.log('plan.status:', result.plan.status);
  console.log('plan.failure:', JSON.stringify(result.plan.failure, null, 2));
  console.log('plan.explanation:', result.plan.explanation);
}

const finalManifest = readManifest(coordinationId, { cwd: tempDir });
console.log('\n--- Final manifest.assignmentRefs (must be EXACTLY []) ---');
console.log(finalManifest.assignmentRefs);

const assignmentsDir = path.join(tempDir, '.fgos', 'assignments');
const assignmentCount = fs.existsSync(assignmentsDir) ? fs.readdirSync(assignmentsDir).length : 0;
console.log('\n--- On-disk .fgos/assignments/ entry count (must be 0) ---');
console.log(assignmentCount);

const pass =
  !threw &&
  result.status === 'planning-failed' &&
  result.plan.status === 'hard-failed' &&
  result.plan.failure.field === 'tier' &&
  finalManifest.assignmentRefs.length === 0 &&
  assignmentCount === 0;

console.log('\n=== R9 PROOF:', pass ? 'PASS' : 'FAIL', '===');
if (!pass) process.exitCode = 1;
