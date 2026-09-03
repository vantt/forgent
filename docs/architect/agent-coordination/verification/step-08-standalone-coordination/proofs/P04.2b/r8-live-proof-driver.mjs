// P04.2b R8 live-proof re-run driver: re-exercises P04.2's own
// `proofs/P04.2/r8-live-proof-driver.mjs` Step 0 reproduction (a direct
// pin to a real non-claude executor at "lightweight" tier) against the
// FIXED code, then runs a full live fan-out/fan-in proof through
// `dispatchResearchFanOut` with the real committed
// `core/coordination-protocols/independent-research-fan-out-fan-in.yaml`
// protocol and the real, committed `.fgos/config.json` runner config --
// real subprocess dispatch, no fake/injected executors.
//
// P04.2's own stop gate: `resolveAssignmentDispatchPolicy`'s tier floor
// (`assignment-policy.mjs`, `opPolicy.minTier || 'standard'`) could only be
// RAISED by a cliOverride, never lowered, and no coordination dispatch had
// any way to populate `assignment.policy` at all -- so no non-claude
// provider family (gemini/openai-codex/z-ai, each configured ONLY at
// "lightweight" in the real committed config) could ever be reached. P04.2b
// closes this by adding a narrow, exactly-one-field-wide `contract.policy =
// {minTier}` exception to the inline-contract wire shape (see
// execution-contract.mjs's own doc comment) and threading a
// below-'standard' composed policy-stack minTier through
// `session-engine.mjs`'s `dispatchDeclaredOperation` into that field. This
// driver proves that fix live, end to end.
//
// Run: node r8-live-proof-driver.mjs
// Requires: real `claude` and `agy` CLIs on PATH, authenticated (this
// session's own environment). Never commits, never mutates the repo
// (mutation: 'read-only' throughout; dispatch workspace is an isolated
// tempDir, never the real repo checkout).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  openDeclaredProtocolSession,
  dispatchDeclaredOperation,
  dispatchResearchFanOut,
  synthesizeResearchFanIn,
} from '../../../../../../../src/runner/coordination/session-engine.mjs';
import { readManifest, readSessionEvents } from '../../../../../../../src/runner/coordination/store.mjs';

const REPO_ROOT = path.resolve(fileURLToPath(new URL('../../../../../../../', import.meta.url)));
const realConfig = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.fgos', 'config.json'), 'utf8'));
const runnerConfig = realConfig.runner ?? realConfig;

console.log('=== P04.2b R8 live-proof re-run: real .fgos/config.json, real subprocess dispatch, no fakes ===\n');
console.log('--- Registered provider families (read live from the real config) ---');
for (const [execId, entry] of Object.entries(runnerConfig.executors)) {
  if (entry.kind !== 'agent') continue;
  console.log(`  ${execId}: providerModel=${entry.providerModel ?? '(claude, default)'}`);
}
console.log('modelPolicies:', JSON.stringify(runnerConfig.modelPolicies, null, 2));

console.log('\n--- git status --porcelain -- src test domains core docs (BEFORE) ---');
console.log(execFileSync('git', ['status', '--porcelain', '--', 'src', 'test', 'domains', 'core', 'docs'], { cwd: REPO_ROOT, encoding: 'utf8' }) || '(clean)');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-r8b-live-proof-'));
console.log('Workspace (isolated, no git repo, no secrets written):', tempDir);

// ─── Step 0: re-run P04.2's own recovery-attempt reproduction ─────────────
console.log('\n=== Step 0: re-run P04.2\'s own direct-pin reproduction (agy-cli/gemini, minTier "lightweight") -- was RunnerConfigError before this fix, must now SUCCEED ===');
const coordinationId0 = 'coord_r8b_recovery_attempt';
openDeclaredProtocolSession(
  {
    definitionId: 'core.coordination-protocol.independent-research-fan-out-fan-in',
    coordinationId: coordinationId0,
    objective: 'P04.2b Step 0: confirm a direct pin to a second real provider family (gemini) at "lightweight" now succeeds.',
    writerId: 'r8b-proof-driver',
  },
  { cwd: tempDir, packageRoot: REPO_ROOT },
);
const coordDispatch0 = await dispatchDeclaredOperation(
  coordinationId0,
  { operationId: 'dispatch-research', objective: 'Fan out.', expectedOutputs: ['agent-result.json (status, summary)'], writerId: 'r8b-proof-driver' },
  { cwd: tempDir, repoRoot: tempDir, packageRoot: REPO_ROOT, runnerConfig },
);
let step0Result = null;
let step0Error = null;
try {
  step0Result = await dispatchDeclaredOperation(
    coordinationId0,
    {
      operationId: 'independent-research',
      targetActorId: 'researcher-a',
      objective: 'Read-only, bounded: name one concrete, verifiable fact about how Node.js Buffer differs from a plain array. Answer in 1-2 sentences.',
      expectedOutputs: ['agent-result.json (status, summary)'],
      writerId: 'r8b-proof-driver',
      fromAssignmentId: coordDispatch0.assignment.assignmentId,
      taskKey: 'recovery-attempt:researcher-a',
      cliPolicy: { preferExecutor: 'agy-cli', minTier: 'lightweight' },
    },
    { cwd: tempDir, repoRoot: tempDir, packageRoot: REPO_ROOT, runnerConfig, timeoutMs: 120000 },
  );
  console.log('Step 0 SUCCEEDED (as predicted by the fix):');
  console.log('  runResult.status:', step0Result.runResult.status, ' confidence:', step0Result.runResult.confidence);
  console.log('  policy.provenance.executor.value:', step0Result.runResult.policy.provenance.executor.value);
  console.log('  policy.provenance.provider.value:', step0Result.runResult.policy.provenance.provider.value);
  console.log('  policy.provenance.tier.value:', step0Result.runResult.policy.provenance.tier.value);
  console.log('  policy.provenance.tier.source:', JSON.stringify(step0Result.runResult.policy.provenance.tier.source));
} catch (err) {
  step0Error = err;
  console.log('Step 0 UNEXPECTEDLY FAILED (fix may be incomplete, or an unrelated live-dispatch issue):');
  console.log(' ', err.constructor.name + ':', err.message);
}

// ─── Step 1: full live fan-out/fan-in proof through dispatchResearchFanOut ─
console.log('\n=== Step 1: full live fan-out/fan-in proof through dispatchResearchFanOut (planCohort\'s own diversity-seeking allocation, real subprocess dispatch) ===');
const coordinationId = 'coord_r8b_live_proof';
const manifest = openDeclaredProtocolSession(
  {
    definitionId: 'core.coordination-protocol.independent-research-fan-out-fan-in',
    coordinationId,
    objective: 'P04.2b R8 live proof: real fan-out/fan-in research protocol, real subprocess dispatch, 2+ real distinct provider families.',
    writerId: 'r8b-proof-driver',
  },
  { cwd: tempDir, packageRoot: REPO_ROOT },
);
console.log('Session opened. actors bound before any Assignment:', manifest.actors.map((a) => a.id));

const coordDispatch = await dispatchDeclaredOperation(
  coordinationId,
  { operationId: 'dispatch-research', objective: 'Fan out two independent, bounded research questions.', expectedOutputs: ['agent-result.json (status, summary)'], writerId: 'r8b-proof-driver' },
  { cwd: tempDir, repoRoot: tempDir, packageRoot: REPO_ROOT, runnerConfig },
);
console.log('Coordinator dispatch-research settled:', coordDispatch.runResult.status, coordDispatch.runResult.confidence, `(family: ${coordDispatch.runResult.policy.provenance.provider.value})`);

const start = Date.now();
const fanOutResult = await dispatchResearchFanOut(
  coordinationId,
  {
    operationId: 'independent-research',
    branches: [
      {
        actorId: 'researcher-a',
        objective: 'Read-only, bounded: name one concrete, verifiable fact about how Node.js child_process.spawn differs from exec. Answer in 2-3 sentences.',
        expectedOutputs: ['agent-result.json (status, summary)'],
        fromAssignmentId: coordDispatch.assignment.assignmentId,
      },
      {
        actorId: 'researcher-b',
        objective: 'Read-only, bounded: name one concrete, verifiable fact about how JavaScript Promise.allSettled differs from Promise.all. Answer in 2-3 sentences.',
        expectedOutputs: ['agent-result.json (status, summary)'],
        fromAssignmentId: coordDispatch.assignment.assignmentId,
      },
    ],
    writerId: 'r8b-proof-driver',
  },
  { cwd: tempDir, repoRoot: tempDir, packageRoot: REPO_ROOT, runnerConfig, timeoutMs: 150000 },
);
const elapsedMs = Date.now() - start;

console.log('\nfan-out status:', fanOutResult.status);
if (fanOutResult.status !== 'dispatched') {
  console.log('reason:', fanOutResult.reason);
  console.log('plan:', JSON.stringify(fanOutResult.plan, null, 2));
} else {
  console.log('\n--- Allocation explanation (planCohort output) ---');
  for (const alloc of fanOutResult.plan.allocations) console.log(' ', alloc.explanation);
  console.log('diversity:', JSON.stringify(fanOutResult.plan.diversity));

  console.log('\n--- Concurrency overlap ---');
  console.log(`Both branches launched via ONE Promise.allSettled batch; total wall time for the batch: ${elapsedMs}ms.`);

  console.log('\n--- Branch outcomes (resolved provenance, real dispatch) ---');
  const families = new Set();
  for (const branch of fanOutResult.branches) {
    const rr = branch.result?.runResult;
    const family = rr?.policy?.provenance?.provider?.value;
    if (branch.status === 'fulfilled' && rr?.status !== 'failed') families.add(family);
    console.log(`  ${branch.actorId}: dispatch=${branch.status}, runResult.status=${rr?.status}, confidence=${rr?.confidence}, executor=${rr?.policy?.provenance?.executor?.value}, provider=${family}, tier=${rr?.policy?.provenance?.tier?.value}`);
    if (branch.status === 'rejected') console.log(`    error: ${branch.error}`);
    if (rr?.agentClaim?.summary) console.log(`    agentClaim.summary: ${String(rr.agentClaim.summary).slice(0, 400)}`);
  }
  console.log(`\nCoordinator family: ${coordDispatch.runResult.policy.provenance.provider.value}; researcher families reached: ${JSON.stringify([...families])}`);
  console.log(`Distinct real provider families across coordinator + researcher branches: ${new Set([coordDispatch.runResult.policy.provenance.provider.value, ...families]).size}`);

  console.log('\n--- Branch isolation (contextRefs) ---');
  for (const branch of fanOutResult.branches) {
    console.log(`  ${branch.actorId}: contextRefs = ${JSON.stringify(branch.result?.assignment?.contextRefs)}`);
  }

  console.log('\n--- Fan-in synthesis ---');
  const synthesis = synthesizeResearchFanIn(coordinationId, { branchActorIds: ['researcher-a', 'researcher-b'], partial: true }, { cwd: tempDir });
  console.log('status:', synthesis.status);
  console.log('accepted:', JSON.stringify(synthesis.accepted, null, 2));
  console.log('unverified:', JSON.stringify(synthesis.unverified, null, 2));
  console.log('failed:', JSON.stringify(synthesis.failed, null, 2));
  console.log('missing:', JSON.stringify(synthesis.missing, null, 2));
  console.log('contradictions:', JSON.stringify(synthesis.contradictions));
  console.log('explanation:', synthesis.explanation);
}

const finalManifest = readManifest(coordinationId, { cwd: tempDir });
console.log('\n--- Final session membership (one-way ref ledger) ---');
console.log('assignmentRefs:', finalManifest.assignmentRefs);
const events = readSessionEvents(coordinationId, { cwd: tempDir });
console.log('event count:', events.length, 'types:', events.map((e) => e.type));

console.log('\n--- Secret check: scanning persisted assignment.json/result.json for any env credential value ---');
const secretPatterns = [/ANTHROPIC_API_KEY/, /ANTHROPIC_AUTH_TOKEN/, /GLM_OPENROUTER_API_KEY/, /sk-[a-zA-Z0-9]{20,}/];
let secretFound = false;
const assignmentsDir = path.join(tempDir, '.fgos', 'assignments');
if (fs.existsSync(assignmentsDir)) {
  for (const asgn of fs.readdirSync(assignmentsDir)) {
    const dir = path.join(assignmentsDir, asgn);
    const walk = (d) => {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, entry.name);
        if (entry.isDirectory()) walk(p);
        else {
          const content = fs.readFileSync(p, 'utf8');
          for (const pat of secretPatterns) {
            if (pat.test(content)) {
              secretFound = true;
              console.log(`  !!! POSSIBLE SECRET MATCH in ${p}: ${pat}`);
            }
          }
        }
      }
    };
    walk(dir);
  }
}
console.log('secretFound:', secretFound, '(expected: false)');

console.log('\n--- git status --porcelain -- src test domains core docs (AFTER) ---');
console.log(execFileSync('git', ['status', '--porcelain', '--', 'src', 'test', 'domains', 'core', 'docs'], { cwd: REPO_ROOT, encoding: 'utf8' }) || '(clean)');

console.log('\n=== P04.2b R8 LIVE PROOF SUMMARY ===');
console.log('Step 0 (direct pin to a second real provider family at "lightweight"):', step0Error ? `FAILED: ${step0Error.message}` : 'SUCCEEDED');
console.log('Workspace (for independent inspection):', tempDir);
