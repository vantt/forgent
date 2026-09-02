// P05.2 R7 supplementary check (NOT a re-run of the full 6-phase proof):
// the primary run (run.log) discovered, from REAL stderr the gemini-family
// executor itself wrote ("Individual quota reached ... Resets in ~3h"),
// that every gemini dispatch in this run window was blocked by a real,
// externally-imposed account quota -- not a framework defect. Only ONE
// provider family (claude) genuinely completed dispatch in the primary run,
// short of R7's own "at least 2 distinct provider families genuinely
// completing dispatch" bar.
//
// This is ONE additional, explicitly bounded, real dispatch (not a retry
// loop) -- re-attempting the earliest-failing operation (cluster-deduplicate)
// against the SAME already-open session (coordinationId below, SAME tempDir,
// via a genuinely NEW taskKey -- never resuming/overwriting the original
// failed Assignment) using `codex-pi` (real cli-spawn, openai-codex family)
// instead of gemini. Judgment call, recorded here: this cell's own
// instructions said to avoid codex-pi/pi-herdr as a general default choice
// ("their own rigorOverrides intent was never verified safe to rely on for
// this specific use") -- but that caution is weighed against gemini's own
// REAL, externally-confirmed unavailability (discovered live, not assumed),
// and the instructions explicitly leave "which 2 families" to this cell's
// own choice, "e.g. availability/reliability found during the attempt."
// This single, clearly-labeled dispatch answers the narrow empirical
// question -- could openai-codex have completed where gemini could not --
// without re-running the whole framework a second time.
//
// Run: node supplement-codex-family-check.mjs > supplement-codex-family-check.log 2>&1

import fs from 'node:fs';
import path from 'node:path';
import { dispatchDeclaredOperation } from '/home/vantt/projects/forgentX/src/runner/coordination/session-engine.mjs';
import { verifyPlannedAllocationAgainstCurrentConfig } from '/home/vantt/projects/forgentX/src/runner/coordination/cohort-planner.mjs';
import { readManifest } from '/home/vantt/projects/forgentX/src/runner/coordination/store.mjs';
import { CASE_BRIEF } from '../case-brief.mjs';

const REPO_ROOT = '/home/vantt/projects/forgentX';
const ARTIFACT_DIR = path.dirname(new URL(import.meta.url).pathname);
const tempDir = '/tmp/fgos-p052-r7-live-proof-wsycE3'; // SAME workspace/session as the primary R7 run
const coordinationId = 'coord_mtjf5l0q_jq9y72';

const realConfig = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.fgos', 'config.json'), 'utf8'));
const runnerConfig = realConfig.runner; // the REAL, unmodified config -- codex-pi is a real, already-registered executor, no clone needed

console.log('=== P05.2 R7 supplement: single real dispatch, codex-pi (openai-codex family), same session ===\n');
console.log('Reusing session:', coordinationId, 'workspace:', tempDir);

const manifest = readManifest(coordinationId, { cwd: tempDir });
console.log('Session status:', manifest.status, 'assignmentRefs so far:', manifest.assignmentRefs.length);

// Synthetic allocation matching codex-pi's real, registered spec (mirrors
// planCohort's own allocation shape) so the SAME R4 handoff function used
// throughout the primary run also gates this supplementary dispatch.
const codexAllocation = {
  actorId: 'clusterer-actor',
  role: 'clusterer',
  operationId: 'cluster-deduplicate',
  executorId: 'codex-pi',
  providerFamily: 'openai-codex',
  tier: 'analytical',
};
const verification = verifyPlannedAllocationAgainstCurrentConfig(codexAllocation, runnerConfig);
console.log('\nR4 verification (codex-pi, analytical):', JSON.stringify(verification, null, 2));
if (verification.abort) {
  console.log('CANNOT PROCEED -- R4 re-verification aborted before dispatch.');
  process.exit(1);
}

const explorerRefs = ['asgn_p05_2_r7_proof_driver_op_002', 'asgn_p05_2_r7_proof_driver_op_003', 'asgn_p05_2_r7_proof_driver_op_004'];

const start = Date.now();
let dispatch = null;
let dispatchError = null;
try {
  dispatch = await dispatchDeclaredOperation(
    coordinationId,
    {
      operationId: 'cluster-deduplicate',
      objective: `Your working directory contains real, already-settled prior outputs at .fgos/assignments/<id>/runs/<N>/agent-report.md for each of these context references: ${JSON.stringify(explorerRefs)}. Read them before answering.\n\n=== Your task (clusterer) ===\nCluster and deduplicate the three explorers' findings into named groups of similar points. Explicitly PRESERVE and LABEL any minority/outlier point that does not cluster with the others -- never discard or silently merge a minority position into a majority cluster.`,
      expectedOutputs: ['Named clusters of findings', 'Explicitly labeled minority/outlier candidates preserved, not discarded'],
      contextRefs: explorerRefs,
      writerId: 'p05.2-r7-supplement-driver',
      taskKey: 'declared:cluster-deduplicate:supplement-codex',
      cliPolicy: { preferExecutor: 'codex-pi' },
    },
    { cwd: tempDir, repoRoot: tempDir, packageRoot: REPO_ROOT, runnerConfig, timeoutMs: 300000 },
  );
} catch (err) {
  dispatchError = err;
}
const elapsedMs = Date.now() - start;

console.log('\nWall time:', elapsedMs, 'ms');
if (dispatchError) {
  console.log('DISPATCH FAILED:', dispatchError.constructor.name, dispatchError.message);
} else {
  const { assignment, runResult } = dispatch;
  console.log('settled:', runResult.status, runResult.confidence, `executor=${runResult.policy.provenance.executor.value} provider=${runResult.policy.provenance.provider.value} tier=${runResult.policy.provenance.tier.value}`);
  console.log('agentClaim.summary:', runResult.agentClaim?.summary);
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'run-result-supplement-codex-cluster-deduplicate.json'), JSON.stringify(runResult, null, 2));
  const runsDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'runs');
  if (fs.existsSync(runsDir)) {
    for (const attempt of fs.readdirSync(runsDir)) {
      const reportPath = path.join(runsDir, attempt, 'agent-report.md');
      if (fs.existsSync(reportPath)) fs.copyFileSync(reportPath, path.join(ARTIFACT_DIR, `agent-report-supplement-codex-cluster-deduplicate-attempt-${attempt}.md`));
    }
  }
}

console.log('\n=== SUPPLEMENT SUMMARY ===');
console.log('openai-codex (codex-pi) genuinely completing dispatch:', dispatchError ? 'no (dispatch threw)' : dispatch.runResult.status !== 'failed' ? 'yes, status=' + dispatch.runResult.status : 'dispatch completed (real subprocess ran) but RunResult.status=failed -- see agentClaim.summary above');
