// P04.2b R8 follow-up: Step 1's concurrent dispatchResearchFanOut showed
// BOTH researcher branches correctly resolved a real, distinct, non-claude
// provider family (gemini/agy-cli, openai-codex/codex-pi) at "lightweight"
// tier -- proving the tier-floor fix's mechanism works -- but neither
// branch settled `done` for real: researcher-a's gemini/agy-cli subprocess
// hit a live account quota limit ("Individual quota reached", external,
// unrelated to this fix), and researcher-b's codex-pi lost the
// pre-existing main-checkout-lock race for the same cwd (a documented,
// correctly-functioning runner-level cap this track's own R5 already
// covers -- see session-engine.mjs's module header). This follow-up
// dispatches codex-pi (openai-codex) ALONE, serially (no lock contention),
// to check whether that SECOND distinct family can complete end to end for
// real right now.
//
// Run: node r8-live-proof-followup-serial.mjs

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDeclaredProtocolSession, dispatchDeclaredOperation } from '../../../../../../../src/runner/coordination/session-engine.mjs';

const REPO_ROOT = path.resolve(fileURLToPath(new URL('../../../../../../../', import.meta.url)));
const realConfig = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.fgos', 'config.json'), 'utf8'));
const runnerConfig = realConfig.runner ?? realConfig;

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-r8b-followup-'));
console.log('Workspace:', tempDir);

const coordinationId = 'coord_r8b_followup_codex_pi';
openDeclaredProtocolSession(
  {
    definitionId: 'core.coordination-protocol.independent-research-fan-out-fan-in',
    coordinationId,
    objective: 'P04.2b follow-up: codex-pi (openai-codex) alone, serial, no lock contention.',
    writerId: 'r8b-followup-driver',
  },
  { cwd: tempDir, packageRoot: REPO_ROOT },
);
const coordDispatch = await dispatchDeclaredOperation(
  coordinationId,
  { operationId: 'dispatch-research', objective: 'Fan out.', expectedOutputs: ['agent-result.json (status, summary)'], writerId: 'r8b-followup-driver' },
  { cwd: tempDir, repoRoot: tempDir, packageRoot: REPO_ROOT, runnerConfig },
);
console.log('Coordinator (claude) settled:', coordDispatch.runResult.status, coordDispatch.runResult.confidence);

let result = null;
let error = null;
try {
  result = await dispatchDeclaredOperation(
    coordinationId,
    {
      operationId: 'independent-research',
      targetActorId: 'researcher-a',
      objective: 'Read-only, bounded: name one concrete, verifiable fact about how Python generators differ from lists. Answer in 1-2 sentences.',
      expectedOutputs: ['agent-result.json (status, summary)'],
      writerId: 'r8b-followup-driver',
      fromAssignmentId: coordDispatch.assignment.assignmentId,
      taskKey: 'followup:researcher-a-codex-pi',
      cliPolicy: { preferExecutor: 'codex-pi', minTier: 'lightweight' },
    },
    { cwd: tempDir, repoRoot: tempDir, packageRoot: REPO_ROOT, runnerConfig, timeoutMs: 150000 },
  );
  console.log('codex-pi (openai-codex) dispatch settled:');
  console.log('  status:', result.runResult.status, ' confidence:', result.runResult.confidence);
  console.log('  executor:', result.runResult.policy.provenance.executor.value, ' provider:', result.runResult.policy.provenance.provider.value, ' tier:', result.runResult.policy.provenance.tier.value);
  if (result.runResult.agentClaim?.summary) console.log('  agentClaim.summary:', String(result.runResult.agentClaim.summary).slice(0, 500));
} catch (err) {
  error = err;
  console.log('codex-pi dispatch THREW:', err.constructor.name, err.message);
}

console.log('\nDistinct real families that reached a settled RunResult in this follow-up:', new Set([
  coordDispatch.runResult.status !== 'failed' ? coordDispatch.runResult.policy.provenance.provider.value : null,
  result && result.runResult.status !== 'failed' ? result.runResult.policy.provenance.provider.value : null,
].filter(Boolean)));
console.log('Workspace (for inspection):', tempDir);
