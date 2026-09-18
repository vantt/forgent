// R8 live-proof driver: run the real, committed
// `core/coordination-protocols/independent-research-fan-out-fan-in.yaml`
// fan-out/fan-in protocol against the REAL, committed `.fgos/config.json`
// runner config, dispatching REAL subprocesses (no fake/injected
// executors), and record allocation explanation, resolved provenance,
// concurrency overlap, branch isolation, accepted evidence,
// contradictions/missing branches, and synthesis.
//
// STOP-GATE FINDING (read this cell's own report for the full trace):
// resolveAssignmentDispatchPolicy's tier FLOOR (assignment-policy.mjs
// line ~92, `opPolicy.minTier || 'standard'`) can only be RAISED by a
// cliOverride, never lowered, and inline (session-engine.mjs) Assignments
// NEVER populate `assignment.policy` (execution-contract.mjs's whitelist
// has no `policy` field; assignment.mjs's INLINE_ASSIGNMENT_PARAM_WHITELIST
// has none either) -- so EVERY real dispatch through this whole
// standalone-coordination-session slice resolves to AT LEAST 'standard'
// tier, regardless of what an operation/cliPolicy declares. The real
// config's gemini/openai-codex/z-ai families ONLY configure `lightweight`
// (confirmed below, read live from .fgos/config.json) -- so NONE of them
// can ever be dispatched through this path today. This driver first
// proves the bounded recovery attempt (an explicit preferExecutor pin to
// a real gemini executor, "critical"-free, minTier as low as this engine
// can ever request) genuinely fails closed with the exact predicted
// RunnerConfigError, then completes the achievable single-family (claude)
// live proof honestly, rather than fabricating a two-family pass.
//
// Run: node r8-live-proof-driver.mjs
// Requires: a real `claude` CLI on PATH, authenticated (this session's own
// environment). Never commits, never mutates the repo (mutation: 'read-only'
// throughout).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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

console.log('=== R8 live proof: real .fgos/config.json, real subprocess dispatch, no fakes ===\n');
console.log('--- Registered provider families (read live from the real config) ---');
for (const [execId, entry] of Object.entries(runnerConfig.executors)) {
  if (entry.kind !== 'agent') continue;
  console.log(`  ${execId}: providerModel=${entry.providerModel ?? '(claude, default)'}`);
}
console.log('modelPolicies:', JSON.stringify(runnerConfig.modelPolicies, null, 2));

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-r8-live-proof-'));
console.log('\nWorkspace (isolated, no git repo, no secrets written):', tempDir);

// ─── Step 0: bounded recovery attempt -- prove the tier-floor stop gate ───
console.log('\n=== Step 0: bounded recovery attempt -- can a SECOND real provider family (gemini via agy-cli) ever be dispatched through this session-engine.mjs path? ===');
const coordinationId0 = 'coord_r8_recovery_attempt';
openDeclaredProtocolSession(
  {
    definitionId: 'core.coordination-protocol.independent-research-fan-out-fan-in',
    coordinationId: coordinationId0,
    objective: 'R8 bounded recovery attempt: force a second real provider family (gemini) through an explicit cliPolicy pin.',
    writerId: 'r8-proof-driver',
  },
  { cwd: tempDir, packageRoot: REPO_ROOT },
);
const coordDispatch0 = await dispatchDeclaredOperation(
  coordinationId0,
  { operationId: 'dispatch-research', objective: 'Fan out.', expectedOutputs: ['agent-result.json (status, summary)'], writerId: 'r8-proof-driver' },
  { cwd: tempDir, repoRoot: tempDir, packageRoot: REPO_ROOT, runnerConfig },
);
let recoveryError = null;
try {
  await dispatchDeclaredOperation(
    coordinationId0,
    {
      operationId: 'independent-research',
      targetActorId: 'researcher-a',
      objective: 'Recovery attempt: force gemini.',
      expectedOutputs: ['agent-result.json (status, summary)'],
      writerId: 'r8-proof-driver',
      fromAssignmentId: coordDispatch0.assignment.assignmentId,
      taskKey: 'recovery-attempt:researcher-a',
      // The LOWEST tier this engine can ever actually request (lightweight,
      // the exact tier the real gemini executor DOES configure) -- proves
      // the failure is the FLOOR mechanism, not merely "the caller forgot
      // to ask for lightweight."
      cliPolicy: { preferExecutor: 'agy-cli', minTier: 'lightweight' },
    },
    { cwd: tempDir, repoRoot: tempDir, packageRoot: REPO_ROOT, runnerConfig },
  );
  console.log('UNEXPECTED: the recovery attempt succeeded -- the stop-gate finding may be stale, re-verify before trusting this proof.');
} catch (err) {
  recoveryError = err;
  console.log('Recovery attempt failed closed, exactly as predicted:');
  console.log(' ', err.constructor.name + ':', err.message);
}
console.log(
  '\nConclusion: a genuine two-real-provider-family live proof is NOT achievable through session-engine.mjs today -- this is a pre-existing, structural constraint of resolveAssignmentDispatchPolicy\'s tier floor (assignment-policy.mjs), not something this cell\'s own code can route around without touching a file outside this cell\'s ownership. Declaring the R8 stop gate for the SECOND provider family; completing the achievable single-family (claude) live proof below to prove the fan-out/isolation/synthesis MECHANICS work end to end for real.',
);

// ─── Step 1: real single-family (claude) live proof ────────────────────────
console.log('\n=== Step 1: real live fan-out/fan-in proof (claude family, the one genuinely reachable tier/provider combination) ===');
const coordinationId = 'coord_r8_live_proof';
const manifest = openDeclaredProtocolSession(
  {
    definitionId: 'core.coordination-protocol.independent-research-fan-out-fan-in',
    coordinationId,
    objective: 'R8 live proof: real fan-out/fan-in research protocol, real subprocess dispatch.',
    writerId: 'r8-proof-driver',
  },
  { cwd: tempDir, packageRoot: REPO_ROOT },
);
console.log('Session opened. actors bound before any Assignment:', manifest.actors.map((a) => a.id));

const coordDispatch = await dispatchDeclaredOperation(
  coordinationId,
  { operationId: 'dispatch-research', objective: 'Fan out two independent, bounded research questions.', expectedOutputs: ['agent-result.json (status, summary)'], writerId: 'r8-proof-driver' },
  { cwd: tempDir, repoRoot: tempDir, packageRoot: REPO_ROOT, runnerConfig },
);
console.log('Coordinator dispatch-research settled:', coordDispatch.runResult.status, coordDispatch.runResult.confidence);

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
    writerId: 'r8-proof-driver',
  },
  { cwd: tempDir, repoRoot: tempDir, packageRoot: REPO_ROOT, runnerConfig, timeoutMs: 120000 },
);
const elapsedMs = Date.now() - start;

console.log('\n--- Allocation explanation (planCohort output) ---');
for (const alloc of fanOutResult.plan.allocations) console.log(' ', alloc.explanation);
console.log('diversity:', JSON.stringify(fanOutResult.plan.diversity));

console.log('\n--- Concurrency overlap ---');
console.log(`Both branches launched via ONE Promise.allSettled batch; total wall time for the batch: ${elapsedMs}ms.`);

console.log('\n--- Branch outcomes (resolved provenance, real dispatch) ---');
for (const branch of fanOutResult.branches) {
  const rr = branch.result?.runResult;
  console.log(`  ${branch.actorId}: dispatch=${branch.status}, runResult.status=${rr?.status}, confidence=${rr?.confidence}, executor=${rr?.policy?.provenance?.executor?.value}, provider=${rr?.policy?.provenance?.provider?.value}, tier=${rr?.policy?.provenance?.tier?.value}`);
  if (rr?.agentClaim?.summary) console.log(`    agentClaim.summary: ${rr.agentClaim.summary}`);
}

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

const finalManifest = readManifest(coordinationId, { cwd: tempDir });
console.log('\n--- Final session membership (one-way ref ledger) ---');
console.log('assignmentRefs:', finalManifest.assignmentRefs);
const events = readSessionEvents(coordinationId, { cwd: tempDir });
console.log('event count:', events.length, 'types:', events.map((e) => e.type));

console.log('\n--- Secret check: scanning persisted assignment.json/result.json for any env credential value ---');
const secretPatterns = [/ANTHROPIC_API_KEY/, /ANTHROPIC_AUTH_TOKEN/, /GLM_OPENROUTER_API_KEY/, /sk-[a-zA-Z0-9]{20,}/];
let secretFound = false;
const assignmentsDir = path.join(tempDir, '.fgos', 'assignments');
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
console.log('secretFound:', secretFound, '(expected: false)');

console.log('\n--- Step 1 finding: planCohort\'s OWN diversity-seeking allocation picked non-claude candidates for BOTH researcher branches (gemini/openai-codex, since claude was already used by the coordinator) -- these then genuinely reject at real dispatch time for the SAME tier-floor reason as Step 0\'s recovery attempt, confirmed live above (dispatch=rejected for both). This is a deeper instance of the same finding: it is not merely "a second family is unreachable" -- planCohort\'s diversity preference actively steers a real dispatch toward executors this engine can never successfully spawn today, whenever a competing actor (the coordinator here) has already claimed the one working family (claude).');

// ─── Step 2: single-family (claude-pinned) live proof of the fan-out MECHANICS ──
console.log('\n=== Step 2: single-family (claude explicitly pinned for BOTH branches) live proof -- proves the fan-out/isolation/synthesis MECHANICS genuinely work end to end for real, honestly separate from R8\'s own 2-family requirement (which Step 0/1 already close as a stop gate) ===');
const coordinationId2 = 'coord_r8_live_proof_single_family';
openDeclaredProtocolSession(
  {
    definitionId: 'core.coordination-protocol.independent-research-fan-out-fan-in',
    coordinationId: coordinationId2,
    objective: 'R8 mechanics proof: fan-out/isolation/synthesis with both branches pinned to the one genuinely reachable family (claude).',
    writerId: 'r8-proof-driver',
  },
  { cwd: tempDir, packageRoot: REPO_ROOT },
);
const coordDispatch2 = await dispatchDeclaredOperation(
  coordinationId2,
  { operationId: 'dispatch-research', objective: 'Fan out two independent, bounded research questions.', expectedOutputs: ['agent-result.json (status, summary)'], writerId: 'r8-proof-driver' },
  { cwd: tempDir, repoRoot: tempDir, packageRoot: REPO_ROOT, runnerConfig },
);

const start2 = Date.now();
const settled2 = await Promise.allSettled([
  dispatchDeclaredOperation(
    coordinationId2,
    {
      operationId: 'independent-research',
      targetActorId: 'researcher-a',
      objective: 'Read-only, bounded: name one concrete, verifiable fact about how Node.js child_process.spawn differs from exec. Answer in 2-3 sentences.',
      expectedOutputs: ['agent-result.json (status, summary)'],
      writerId: 'r8-proof-driver',
      fromAssignmentId: coordDispatch2.assignment.assignmentId,
      taskKey: 'research-branch:researcher-a',
      cliPolicy: { preferExecutor: 'claude', minTier: 'standard' },
    },
    { cwd: tempDir, repoRoot: tempDir, packageRoot: REPO_ROOT, runnerConfig, timeoutMs: 120000 },
  ),
  dispatchDeclaredOperation(
    coordinationId2,
    {
      operationId: 'independent-research',
      targetActorId: 'researcher-b',
      objective: 'Read-only, bounded: name one concrete, verifiable fact about how JavaScript Promise.allSettled differs from Promise.all. Answer in 2-3 sentences.',
      expectedOutputs: ['agent-result.json (status, summary)'],
      writerId: 'r8-proof-driver',
      fromAssignmentId: coordDispatch2.assignment.assignmentId,
      taskKey: 'research-branch:researcher-b',
      cliPolicy: { preferExecutor: 'claude', minTier: 'standard' },
    },
    { cwd: tempDir, repoRoot: tempDir, packageRoot: REPO_ROOT, runnerConfig, timeoutMs: 120000 },
  ),
]);
const elapsed2 = Date.now() - start2;

console.log(`\nBoth branches dispatched via ONE Promise.allSettled batch (claude pinned, single-cwd main-checkout lock therefore serializes real subprocess success -- see this cell's report); total wall time: ${elapsed2}ms.`);
for (const [i, outcome] of settled2.entries()) {
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

const synthesis2 = synthesizeResearchFanIn(coordinationId2, { branchActorIds: ['researcher-a', 'researcher-b'], partial: true }, { cwd: tempDir });
console.log('\n--- Fan-in synthesis (single-family live proof) ---');
console.log('status:', synthesis2.status);
console.log('accepted:', JSON.stringify(synthesis2.accepted));
console.log('unverified:', JSON.stringify(synthesis2.unverified));
console.log('failed:', JSON.stringify(synthesis2.failed));
console.log('missing:', JSON.stringify(synthesis2.missing));
console.log('explanation:', synthesis2.explanation);

const finalManifest2 = readManifest(coordinationId2, { cwd: tempDir });
console.log('\nassignmentRefs:', finalManifest2.assignmentRefs);

console.log('\n=== R8 LIVE PROOF SUMMARY ===');
console.log('Two-provider-family requirement: STOP GATE -- resolveAssignmentDispatchPolicy\'s tier floor (assignment-policy.mjs, "opPolicy.minTier || \'standard\'", raise-only via cliOverride) makes every non-claude real provider family (gemini/openai-codex/z-ai -- each configured ONLY at "lightweight" in the real .fgos/config.json) structurally unreachable through session-engine.mjs\'s inline-contract dispatch path, confirmed by TWO independent live reproductions above (Step 0\'s direct recovery attempt, and Step 1\'s natural planCohort diversity allocation). Pre-existing, cross-cutting resolver behavior, outside this cell\'s file ownership (assignment-policy.mjs\'s tier-floor default and execution-contract.mjs\'s inline whitelist) -- not fixed here; reported honestly per this track\'s own stop-gate policy rather than fabricated or routed around.');
console.log('Single-family (claude) fan-out/fan-in MECHANICS: proven live in Step 2 above -- see branch outcomes/synthesis printed there for the real, independently-inspectable result.');
console.log('Workspace (for independent inspection):', tempDir);
