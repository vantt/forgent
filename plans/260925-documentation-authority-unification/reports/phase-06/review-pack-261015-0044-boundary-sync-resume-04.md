# Bounded review: boundary-sync-resume-04

Author session: codex-session:28@2026-10-15
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Entries: 25
Review status: pending
Review scope: A31: merge conflict resolutions, created conservation rows and evidence-pin accounting only

All displayed bytes are complete, with explicit historical pins. No prior approval certifies changed content. Ordinary claims use the existing Claim | Verdict | Note | Source digest | Target digest contract; proposal, truth and merge accounting IDs use separately labelled accounting verdicts. Never fabricate claim IDs for accounting. Full shown-text digests accompany native unit digests.

## Required differing-digest reads (A36)

- classification-claim_75041e871c0b191949808b55f541184d
- classification-claim_0e2474daa2e50a259dd3a37b94f26b81
- classification-claim_b9b42545b42b04889685191ada1a3892

## Absent targets

none

## receipt-claim_3adcdb2c2ecf7b170f811db859ee7dd3-s2-agent-coordination-registry-projection

Entry kind: code-receipt-accounting
Class: Judgment
Source digest: eb6de12a0a4f891ebd4bd7d4b93acb7a10385fa245cc6366abbec829d102dda0
Target digest: eb6de12a0a4f891ebd4bd7d4b93acb7a10385fa245cc6366abbec829d102dda0

### Merge accounting

```json
{
  "mode": "candidate-unverified",
  "originalReviewedRef": {
    "claimId": "claim_3adcdb2c2ecf7b170f811db859ee7dd3",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-repin.json",
    "receiptCommit": "b6cdda81b333a375ebfb72141e962e1feac724f0",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "reviewed",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-13",
    "reviewedAt": "2026-10-13",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-boundary-repins.md",
    "reviewReportCommit": "168a27c6c704854b4777792e6632302f1616c65a",
    "reviewMode": "ordinary",
    "reviewNote": "machine re-pin of 2269f2d27:candidate-classifications-agent-coordination-recovery.json receipt; object equal after restoring evidence pins; 1 cited range byte-equal, excerptDigest equal; evidence digest recomputed equal"
  },
  "currentPendingRef": {
    "claimId": "claim_3adcdb2c2ecf7b170f811db859ee7dd3",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-repin.json",
    "receiptCommit": "b6cdda81b333a375ebfb72141e962e1feac724f0",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "pending",
    "pendingReason": "A31 cited code changed; old receipt stays immutable history, current native unit candidate-unverified under A28; full truth check owed at promotion."
  },
  "completeOldReceipt": {
    "claimId": "claim_3adcdb2c2ecf7b170f811db859ee7dd3",
    "path": "docs/platform/agent-coordination/vocabulary/canonical-concepts.md",
    "anchor": "unheaded-block-24",
    "unitDigest": "eb6de12a0a4f891ebd4bd7d4b93acb7a10385fa245cc6366abbec829d102dda0",
    "shownText": "Reserved vocabulary for a possible future scheduler, not a third dispatch\ntarget or an already implemented queue entity. A Run is one concrete attempt;\nit is not a Job. See the retained\n[dispatch-job reservation](../decisions/ADR-004-reserve-job.md).",
    "shownTextDigest": "eb6de12a0a4f891ebd4bd7d4b93acb7a10385fa245cc6366abbec829d102dda0",
    "class": "candidate-native-content",
    "authoredBy": "codex-session:1@2026-10-10",
    "rationale": "This current unit belongs to the truth-only section Canonical Agent Coordination Concepts > Evidence And Visibility Layer > Job, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: verified. No prior verdict is carried to this receipt.",
    "truthSection": {
      "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
      "anchor": "job",
      "status": "verified",
      "reason": null
    },
    "currentEvidence": {
      "commit": "0653419c19e7c37d8d00408ad482cdecbd45a807",
      "finding": "true-and-current",
      "citations": [
        {
          "path": "src/runner/dispatch/run-result.mjs",
          "startLine": 1245,
          "endLine": 1330,
          "blobSha": "a08dc676045d3775598287963ff8c157b5fabcba"
        },
        {
          "path": "src/runner/dispatch/evidence-attribution.mjs",
          "startLine": 31,
          "endLine": 83,
          "blobSha": "73dc6379b50bc0a02dc9742873607d89ad4a1056"
        },
        {
          "path": "src/runner/dispatch/transport.mjs",
          "startLine": 748,
          "endLine": 790,
          "blobSha": "acd13397a165d98cf3b5ef3d55b90ce9cf05db93"
        }
      ],
      "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. The specific current code/consumer boundary is checked in the cited section.",
      "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
    },
    "recoveryProvenance": {
      "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
      "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
      "receiptClaimId": "claim_633d1e483c40dbcbd205c523b6f7892d",
      "report": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
      "reportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
      "verdictClaimId": "claim_633d1e483c40dbcbd205c523b6f7892d",
      "unitDigest": "eb6de12a0a4f891ebd4bd7d4b93acb7a10385fa245cc6366abbec829d102dda0",
      "originalAuthorSession": "codex-session:1@2026-10-10"
    }
  },
  "allCitationComparisons": [
    {
      "path": "src/runner/dispatch/run-result.mjs",
      "beforeBlob": "a08dc676045d3775598287963ff8c157b5fabcba",
      "afterBlob": "6f2c075c91efdc24601f13274bc8fa9a71d65513",
      "beforeStartLine": 1245,
      "beforeEndLine": 1330,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "  const workerArtifacts = Array.isArray(evidenceFloor.workerArtifacts) ? evidenceFloor.workerArtifacts : [];\n  const changedFiles = Array.isArray(evidenceFloor.changedFiles) ? evidenceFloor.changedFiles : [];\n  const hasDirtyBeforeMutation = evidenceFloor.hasDirtyBeforeMutation === true;\n  const isReadOnlyOperation = evidenceFloor.isReadOnlyOperation === true;\n\n  if (isTimeout || (exitCode !== null && exitCode !== undefined && exitCode !== 0) || signal) {\n    return { status: 'failed', confidence: 'failed' };\n  }\n  if (claimInvalid) {\n    return { status: 'failed', confidence: 'failed' };\n  }\n  const companionReportArtifacts = workerArtifacts.filter(\n    (p) => typeof p === 'string' && !p.endsWith('agent-result.json') && !/[/\\\\]outbox[/\\\\]result-\\d+\\.json$/.test(p),\n  );\n  const hasWorkerReport = companionReportArtifacts.length > 0;\n\n  if (agentClaim?.status === 'failed') {\n    const isFindingVerdict = agentClaim?.assessment?.verdict === 'findings';\n    if (isFindingVerdict && hasWorkerReport && exitCode === 0 && !isTimeout) {\n      return { status: 'failed', confidence: 'reported' };\n    }\n    return { status: 'failed', confidence: 'failed' };\n  }\n\n  const hasExternalEvidence = changedFiles.length > 0 || hasDirtyBeforeMutation;\n  if (isReadOnlyOperation && hasExternalEvidence) {\n    return { status: 'failed', confidence: 'failed' };\n  }\n  if (agentClaim?.status === 'blocked') {\n    return { status: 'blocked', confidence: 'reported' };\n  }\n  if (agentClaim && agentClaim.status === 'done') {\n    if (isReadOnlyOperation) {\n      return hasWorkerReport ? { status: 'done', confidence: 'reported' } : { status: 'no-evidence', confidence: 'no-evidence' };\n    }\n    return hasExternalEvidence ? { status: 'done', confidence: 'verified' } : { status: 'no-evidence', confidence: 'no-evidence' };\n  }\n  if (!isReadOnlyOperation && hasExternalEvidence) {\n    return { status: 'done', confidence: 'inferred' };\n  }\n  return { status: 'no-evidence', confidence: 'no-evidence' };\n}\n/**\n * Unified helper for reading RunResult outcome.\n * Single path for all dispatch, coordination, loop, show, and legality decisions.\n *\n * @param {object|string} resultOrPath\n * @param {object} [options]\n * @param {object} [options.evidenceFloor]\n * @returns {Readonly<{\n *   category: 'ok'|'infra'|'verdict'|'policy'|'blocked'|'corrupt',\n *   executed: 'completed'|'failed'|'cancelled'|'unknown',\n *   verdict: 'pass'|'findings'|'blocked'|'inconclusive'|'not-applicable',\n *   refused: boolean,\n *   evidence: 'verified'|'reported'|'inferred'|'none'|'failed',\n *   satisfied: boolean,\n *   infraFailure: boolean,\n *   failure: object|null\n * }>}\n */\nexport function runOutcome(resultOrPath, { evidenceFloor } = {}) {\n  const derivedFloor = evidenceFloor && typeof evidenceFloor === 'object' ? deriveEvidenceFloor(evidenceFloor) : null;\n  const result = typeof resultOrPath === 'string'\n    ? interpretRunResult(resultOrPath)\n    : (resultOrPath?.classification !== undefined || resultOrPath?.contract !== undefined\n      ? interpretRunResult(resultOrPath)\n      : interpretRunResult(resultOrPath));\n\n  // Fail-closed with corrupt records\n  if (\n    !result ||\n    result.corrupt ||\n    result.contractCorrupt ||\n    result.resultCorrupt ||\n    result.classification?.provenance === 'contract-corrupt'\n  ) {\n    const evidenceLevel = (derivedFloor?.confidence === 'no-evidence' || derivedFloor?.status === 'no-evidence')\n      ? 'no-evidence'\n      : 'failed';\n    return Object.freeze({\n      category: 'corrupt',\n      executed: 'unknown',\n      verdict: 'inconclusive',\n      refused: true,\n      evidence: evidenceLevel,\n      satisfied: false,",
      "excerptDigest": "50c8e2860e27e28e74a040303380d35ddd58d360dc41d7ec4017bc750a3e192e"
    },
    {
      "path": "src/runner/dispatch/evidence-attribution.mjs",
      "beforeBlob": "73dc6379b50bc0a02dc9742873607d89ad4a1056",
      "afterBlob": "e09504371a539816e5195f4b33a87f0c158c07ad",
      "beforeStartLine": 31,
      "beforeEndLine": 83,
      "startLine": 33,
      "endLine": 85,
      "status": "unchanged-excerpt",
      "excerpt": "export function attributeWorkspaceChanges({\n  preLaunchDirt = [],\n  postRunDirt = [],\n  dirtyBeforeHashes = {},\n  postRunHashes = {},\n  declaredCoverage = null,\n  adapterAttestation = null,\n} = {}) {\n  const records = [];\n  const preDirtSet = new Set(preLaunchDirt || []);\n  const postDirtSet = new Set(postRunDirt || []);\n\n  const allPaths = Array.from(new Set([...preDirtSet, ...postDirtSet])).sort();\n\n  for (const filePath of allPaths) {\n    const wasPre = preDirtSet.has(filePath);\n    const isPost = postDirtSet.has(filePath);\n\n    if (wasPre && isPost) {\n      const preHash = dirtyBeforeHashes[filePath];\n      const postHash = postRunHashes[filePath];\n\n      if (preHash && postHash && preHash === postHash) {\n        // Pre-existing dirt unchanged during run -> excluded\n        records.push({\n          path: filePath,\n          firstObserved: 'pre-launch',\n          level: 'excluded',\n          basis: ['dirty-before-hash-match'],\n          coverageMatched: false,\n        });\n      } else if (preHash && postHash && preHash !== postHash) {\n        // Pre-existing dirt mutated during run -> correlated (or proven if covered)\n        const isCovered = checkCoverage(filePath, declaredCoverage);\n        const hasPositiveAttestation = checkAttestation(filePath, adapterAttestation);\n        records.push({\n          path: filePath,\n          firstObserved: 'pre-launch',\n          level: hasPositiveAttestation && isCovered ? 'proven' : 'correlated',\n          basis: hasPositiveAttestation && isCovered\n            ? ['adapter-confinement-attestation', 'pre-existing-dirt-mutated']\n            : ['pre-existing-dirt-mutated', 'pre-post-git-snapshot'],\n          coverageMatched: isCovered,\n        });\n      } else {\n        // Hashes missing but present in both -> excluded by default timing unless mutatedDirtyBeforeFiles says otherwise\n        records.push({\n          path: filePath,\n          firstObserved: 'pre-launch',\n          level: 'excluded',\n          basis: ['pre-launch-git-status'],\n          coverageMatched: false,\n        });",
      "excerptDigest": "fdff7cd499c0b8c6010af6e6c900a72cbb2e915f2810f7b7fedc3a6a22416b0a"
    },
    {
      "path": "src/runner/dispatch/transport.mjs",
      "beforeBlob": "acd13397a165d98cf3b5ef3d55b90ce9cf05db93",
      "afterBlob": "f806a07c208793bf5717dfd9a553ff87f6f6ef5c",
      "beforeStartLine": 748,
      "beforeEndLine": 790,
      "startLine": 770,
      "endLine": 812,
      "status": "unchanged-excerpt",
      "excerpt": "/**\n * The `herdr-spawn` executor adapter: run the worker as a real interactive\n * agent in a pane a person can watch, and conclude nothing about the work\n * from anything except a file the worker itself wrote.\n *\n * Three things this adapter refuses to do, each because doing it failed in\n * production:\n *\n * 1. It never types the prompt as a shell command. The old path quoted the\n *    prompt into an argv string and let `herdr pane run` type it as\n *    keystrokes, which corrupts every multi-line prompt there is -- and a\n *    real implementation prompt is always multi-line. The prompt goes to\n *    disk; one line pointing at it goes through the terminal.\n *\n * 2. It never treats `agent_status` as completion. That reading was wrong\n *    twice in measured production: `idle` before the agent had started at\n *    all, and an `idle`-looking dip between two tool calls of one turn.\n *    Completion is `outbox/result-<round>.json` existing, nothing else.\n *\n * 3. It never closes the pane on failure. A failed dispatch's pane is the\n *    only place the reason is still legible, so it stays open and the error\n *    carries its id.\n *\n * HARD CONSTRAINT (tsk-1nih, live evidence): always a FRESH pane, never a\n * reused one. Delivering a dispatch into a finished worker's pane sends it\n * as chat to an idle REPL.\n *\n * Startup goes through `herdr agent start`, which returns only once herdr\n * has confirmed a ready agent in the pane -- that is what absorbs the shell\n * boot race the old path had to poll around, and it fails by name\n * (`agent_not_ready`) instead of hanging.\n */\nfunction herdrSpawnInteractiveAdapter(invocation, opts) {\n  const { command, args, argsTemplate, prompt, env: rawEnv, interactiveMode, promptDelivery, permissionMode, confinement } = invocation;\n  const { exitCommand, kind, usageLimitPatterns, trustStore } = interactiveMode;\n  const {\n    cwd, timeoutMs, idleTimeoutMs, workId, tier, model,\n    herdrBin: optsHerdrBin, onChunk, runDir: optsRunDir,\n    // An automated sweep may close the panes of failed rounds. It never\n    // closes one paused on a provider limit -- that screen is the only place\n    // the reset time is written.\n    closeAlways = false,\n    // A pane already sitting in the caller's own tab (one lead's coding panel",
      "excerptDigest": "b679003cd19161a05914a0adbfae3d83da9a5854d59b81cb92e5c61e2a91799b"
    }
  ],
  "receiptArtifact": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-sync-repin.json",
  "receiptCommit": "6c6a65e8543fa72012bd55f8999f13f9ed6193c4",
  "meaning": "Cited code changed; receipt remains immutable history, current unit candidate-unverified; no truth re-verification."
}
```

### Complete source / predecessor

Path/anchor: docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-24
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: eb6de12a0a4f891ebd4bd7d4b93acb7a10385fa245cc6366abbec829d102dda0
Shown text SHA256: eb6de12a0a4f891ebd4bd7d4b93acb7a10385fa245cc6366abbec829d102dda0
Lines: 161 to 164

```text
Reserved vocabulary for a possible future scheduler, not a third dispatch
target or an already implemented queue entity. A Run is one concrete attempt;
it is not a Job. See the retained
[dispatch-job reservation](../decisions/ADR-004-reserve-job.md).
```

### Complete target / successor

Path/anchor: docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-24
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: eb6de12a0a4f891ebd4bd7d4b93acb7a10385fa245cc6366abbec829d102dda0
Shown text SHA256: eb6de12a0a4f891ebd4bd7d4b93acb7a10385fa245cc6366abbec829d102dda0
Lines: 161 to 164

```text
Reserved vocabulary for a possible future scheduler, not a third dispatch
target or an already implemented queue entity. A Run is one concrete attempt;
it is not a Job. See the retained
[dispatch-job reservation](../decisions/ADR-004-reserve-job.md).
```

### Full diff

```diff

```

## receipt-claim_8d1098aad227478a4ecfba67e29f6a69-s2-agent-coordination-registry-projection

Entry kind: code-receipt-accounting
Class: Judgment
Source digest: 003c1b2a63f116cca3436c0e115d7c9252520c7f5d36634483efdd5428381e3a
Target digest: 003c1b2a63f116cca3436c0e115d7c9252520c7f5d36634483efdd5428381e3a

### Merge accounting

```json
{
  "mode": "repin",
  "originalReviewedRef": {
    "claimId": "claim_8d1098aad227478a4ecfba67e29f6a69",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-repin.json",
    "receiptCommit": "b6cdda81b333a375ebfb72141e962e1feac724f0",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "reviewed",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-13",
    "reviewedAt": "2026-10-13",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-boundary-repins.md",
    "reviewReportCommit": "168a27c6c704854b4777792e6632302f1616c65a",
    "reviewMode": "ordinary",
    "reviewNote": "machine re-pin of 2269f2d27:candidate-classifications-agent-coordination-recovery.json receipt; object equal after restoring evidence pins; 2 cited ranges byte-equal, excerptDigest equal; evidence digest recomputed equal"
  },
  "currentPendingRef": {
    "claimId": "claim_8d1098aad227478a4ecfba67e29f6a69",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-sync-repin.json",
    "receiptCommit": "6c6a65e8543fa72012bd55f8999f13f9ed6193c4",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "pending",
    "pendingReason": "A31 unchanged cited bytes re-pin; independent machine verification pending, no truth re-review."
  },
  "completeOldReceipt": {
    "claimId": "claim_8d1098aad227478a4ecfba67e29f6a69",
    "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "anchor": "unheaded-block-135",
    "unitDigest": "003c1b2a63f116cca3436c0e115d7c9252520c7f5d36634483efdd5428381e3a",
    "shownText": "Status: implemented in the reviewed candidate.",
    "shownTextDigest": "003c1b2a63f116cca3436c0e115d7c9252520c7f5d36634483efdd5428381e3a",
    "class": "candidate-native-content",
    "authoredBy": "codex-session:1@2026-10-10",
    "rationale": "This current unit belongs to the truth-only section Dispatch Control Plane Redesign > 14. Narrow Implementation Status > 14.3 Item 2 - `herdr-spawn` Adapter, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: open; Dated finding/candidate/task-window record, explicitly not a current runtime assertion or fresh proof. Its old execution counts/probes have not been reproduced by this truth pass (UNPROVEN).. No prior verdict is carried to this receipt.",
    "truthSection": {
      "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
      "anchor": "143-item-2---herdr-spawn-adapter",
      "status": "open",
      "reason": "Dated finding/candidate/task-window record, explicitly not a current runtime assertion or fresh proof. Its old execution counts/probes have not been reproduced by this truth pass (UNPROVEN)."
    },
    "currentEvidence": {
      "commit": "0653419c19e7c37d8d00408ad482cdecbd45a807",
      "finding": "true-and-current",
      "citations": [
        {
          "path": "src/runner/dispatch/transport.mjs",
          "startLine": 748,
          "endLine": 790,
          "blobSha": "acd13397a165d98cf3b5ef3d55b90ce9cf05db93"
        },
        {
          "path": "src/runner/dispatch/transport.mjs",
          "startLine": 915,
          "endLine": 923,
          "blobSha": "acd13397a165d98cf3b5ef3d55b90ce9cf05db93"
        }
      ],
      "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. Dated finding/candidate/task-window record, explicitly not a current runtime assertion or fresh proof. Its old execution counts/probes have not been reproduced by this truth pass (UNPROVEN).",
      "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
    },
    "recoveryProvenance": {
      "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
      "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
      "receiptClaimId": "claim_identity_gap_a4d78a2cbd06571524e6ea0b",
      "report": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
      "reportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
      "verdictClaimId": "claim_identity_gap_a4d78a2cbd06571524e6ea0b",
      "unitDigest": "003c1b2a63f116cca3436c0e115d7c9252520c7f5d36634483efdd5428381e3a",
      "originalAuthorSession": "codex-session:1@2026-10-10"
    }
  },
  "allCitationComparisons": [
    {
      "path": "src/runner/dispatch/transport.mjs",
      "beforeBlob": "acd13397a165d98cf3b5ef3d55b90ce9cf05db93",
      "afterBlob": "f806a07c208793bf5717dfd9a553ff87f6f6ef5c",
      "beforeStartLine": 748,
      "beforeEndLine": 790,
      "startLine": 770,
      "endLine": 812,
      "status": "unchanged-excerpt",
      "excerpt": "/**\n * The `herdr-spawn` executor adapter: run the worker as a real interactive\n * agent in a pane a person can watch, and conclude nothing about the work\n * from anything except a file the worker itself wrote.\n *\n * Three things this adapter refuses to do, each because doing it failed in\n * production:\n *\n * 1. It never types the prompt as a shell command. The old path quoted the\n *    prompt into an argv string and let `herdr pane run` type it as\n *    keystrokes, which corrupts every multi-line prompt there is -- and a\n *    real implementation prompt is always multi-line. The prompt goes to\n *    disk; one line pointing at it goes through the terminal.\n *\n * 2. It never treats `agent_status` as completion. That reading was wrong\n *    twice in measured production: `idle` before the agent had started at\n *    all, and an `idle`-looking dip between two tool calls of one turn.\n *    Completion is `outbox/result-<round>.json` existing, nothing else.\n *\n * 3. It never closes the pane on failure. A failed dispatch's pane is the\n *    only place the reason is still legible, so it stays open and the error\n *    carries its id.\n *\n * HARD CONSTRAINT (tsk-1nih, live evidence): always a FRESH pane, never a\n * reused one. Delivering a dispatch into a finished worker's pane sends it\n * as chat to an idle REPL.\n *\n * Startup goes through `herdr agent start`, which returns only once herdr\n * has confirmed a ready agent in the pane -- that is what absorbs the shell\n * boot race the old path had to poll around, and it fails by name\n * (`agent_not_ready`) instead of hanging.\n */\nfunction herdrSpawnInteractiveAdapter(invocation, opts) {\n  const { command, args, argsTemplate, prompt, env: rawEnv, interactiveMode, promptDelivery, permissionMode, confinement } = invocation;\n  const { exitCommand, kind, usageLimitPatterns, trustStore } = interactiveMode;\n  const {\n    cwd, timeoutMs, idleTimeoutMs, workId, tier, model,\n    herdrBin: optsHerdrBin, onChunk, runDir: optsRunDir,\n    // An automated sweep may close the panes of failed rounds. It never\n    // closes one paused on a provider limit -- that screen is the only place\n    // the reset time is written.\n    closeAlways = false,\n    // A pane already sitting in the caller's own tab (one lead's coding panel",
      "excerptDigest": "b679003cd19161a05914a0adbfae3d83da9a5854d59b81cb92e5c61e2a91799b"
    },
    {
      "path": "src/runner/dispatch/transport.mjs",
      "beforeBlob": "acd13397a165d98cf3b5ef3d55b90ce9cf05db93",
      "afterBlob": "f806a07c208793bf5717dfd9a553ff87f6f6ef5c",
      "beforeStartLine": 915,
      "beforeEndLine": 923,
      "startLine": 937,
      "endLine": 945,
      "status": "unchanged-excerpt",
      "excerpt": "export function herdrSpawnAdapter(invocation, opts) {\n  if (invocation.interactiveMode) {\n    return herdrSpawnInteractiveAdapter(invocation, opts);\n  }\n  return Promise.reject(new DispatchError(\n    'invalid-config',\n    `executor for work \"${opts?.workId}\" refused: herdr-spawn adapter requires interactiveMode to be configured -- it no longer supports a non-interactive dispatch path.`,\n    { workId: opts?.workId, tier: opts?.tier, model: opts?.model },\n  ));",
      "excerptDigest": "a8d68b734f0a5656c2187d8542146814c7394b144b74b1a22842a530d294ea12"
    }
  ],
  "receiptArtifact": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-sync-repin.json",
  "receiptCommit": "6c6a65e8543fa72012bd55f8999f13f9ed6193c4",
  "meaning": "Machine exact cited-byte and non-pin-field comparison only; no truth re-review."
}
```

### Complete source / predecessor

Path/anchor: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-135
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 003c1b2a63f116cca3436c0e115d7c9252520c7f5d36634483efdd5428381e3a
Shown text SHA256: 003c1b2a63f116cca3436c0e115d7c9252520c7f5d36634483efdd5428381e3a
Lines: 750 to 750

```text
Status: implemented in the reviewed candidate.
```

### Complete target / successor

Path/anchor: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-135
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 003c1b2a63f116cca3436c0e115d7c9252520c7f5d36634483efdd5428381e3a
Shown text SHA256: 003c1b2a63f116cca3436c0e115d7c9252520c7f5d36634483efdd5428381e3a
Lines: 750 to 750

```text
Status: implemented in the reviewed candidate.
```

### Full diff

```diff

```

## receipt-claim_b36b3352394e5987921d8ca3fab02023-s2-agent-coordination-registry-projection

Entry kind: code-receipt-accounting
Class: Judgment
Source digest: 320e0ee20283f6f05f4296c40ae7077e943deffd6d41f49c7069c673f0a7b546
Target digest: 320e0ee20283f6f05f4296c40ae7077e943deffd6d41f49c7069c673f0a7b546

### Merge accounting

```json
{
  "mode": "repin",
  "originalReviewedRef": {
    "claimId": "claim_b36b3352394e5987921d8ca3fab02023",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-repin.json",
    "receiptCommit": "b6cdda81b333a375ebfb72141e962e1feac724f0",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "reviewed",
    "reviewedBy": "reviewer:claude-session:a4954387@2026-10-13",
    "reviewedAt": "2026-10-13",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-3-boundary-repins.md",
    "reviewReportCommit": "168a27c6c704854b4777792e6632302f1616c65a",
    "reviewMode": "ordinary",
    "reviewNote": "machine re-pin of 2269f2d27:candidate-classifications-agent-coordination-recovery.json receipt; object equal after restoring evidence pins; 2 cited ranges byte-equal, excerptDigest equal; evidence digest recomputed equal"
  },
  "currentPendingRef": {
    "claimId": "claim_b36b3352394e5987921d8ca3fab02023",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-sync-repin.json",
    "receiptCommit": "6c6a65e8543fa72012bd55f8999f13f9ed6193c4",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "pending",
    "pendingReason": "A31 unchanged cited bytes re-pin; independent machine verification pending, no truth re-review."
  },
  "completeOldReceipt": {
    "claimId": "claim_b36b3352394e5987921d8ca3fab02023",
    "path": "docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md",
    "anchor": "unheaded-block-136",
    "unitDigest": "320e0ee20283f6f05f4296c40ae7077e943deffd6d41f49c7069c673f0a7b546",
    "shownText": "Implemented behavior:",
    "shownTextDigest": "320e0ee20283f6f05f4296c40ae7077e943deffd6d41f49c7069c673f0a7b546",
    "class": "candidate-native-content",
    "authoredBy": "codex-session:1@2026-10-10",
    "rationale": "This current unit belongs to the truth-only section Dispatch Control Plane Redesign > 14. Narrow Implementation Status > 14.3 Item 2 - `herdr-spawn` Adapter, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: open; Dated finding/candidate/task-window record, explicitly not a current runtime assertion or fresh proof. Its old execution counts/probes have not been reproduced by this truth pass (UNPROVEN).. No prior verdict is carried to this receipt.",
    "truthSection": {
      "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
      "anchor": "143-item-2---herdr-spawn-adapter",
      "status": "open",
      "reason": "Dated finding/candidate/task-window record, explicitly not a current runtime assertion or fresh proof. Its old execution counts/probes have not been reproduced by this truth pass (UNPROVEN)."
    },
    "currentEvidence": {
      "commit": "0653419c19e7c37d8d00408ad482cdecbd45a807",
      "finding": "true-and-current",
      "citations": [
        {
          "path": "src/runner/dispatch/transport.mjs",
          "startLine": 748,
          "endLine": 790,
          "blobSha": "acd13397a165d98cf3b5ef3d55b90ce9cf05db93"
        },
        {
          "path": "src/runner/dispatch/transport.mjs",
          "startLine": 915,
          "endLine": 923,
          "blobSha": "acd13397a165d98cf3b5ef3d55b90ce9cf05db93"
        }
      ],
      "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. Dated finding/candidate/task-window record, explicitly not a current runtime assertion or fresh proof. Its old execution counts/probes have not been reproduced by this truth pass (UNPROVEN).",
      "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
    },
    "recoveryProvenance": {
      "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
      "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
      "receiptClaimId": "claim_identity_gap_25e5d945e6bcfb37b1d3c891",
      "report": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
      "reportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea",
      "verdictClaimId": "claim_identity_gap_25e5d945e6bcfb37b1d3c891",
      "unitDigest": "320e0ee20283f6f05f4296c40ae7077e943deffd6d41f49c7069c673f0a7b546",
      "originalAuthorSession": "codex-session:1@2026-10-10"
    }
  },
  "allCitationComparisons": [
    {
      "path": "src/runner/dispatch/transport.mjs",
      "beforeBlob": "acd13397a165d98cf3b5ef3d55b90ce9cf05db93",
      "afterBlob": "f806a07c208793bf5717dfd9a553ff87f6f6ef5c",
      "beforeStartLine": 748,
      "beforeEndLine": 790,
      "startLine": 770,
      "endLine": 812,
      "status": "unchanged-excerpt",
      "excerpt": "/**\n * The `herdr-spawn` executor adapter: run the worker as a real interactive\n * agent in a pane a person can watch, and conclude nothing about the work\n * from anything except a file the worker itself wrote.\n *\n * Three things this adapter refuses to do, each because doing it failed in\n * production:\n *\n * 1. It never types the prompt as a shell command. The old path quoted the\n *    prompt into an argv string and let `herdr pane run` type it as\n *    keystrokes, which corrupts every multi-line prompt there is -- and a\n *    real implementation prompt is always multi-line. The prompt goes to\n *    disk; one line pointing at it goes through the terminal.\n *\n * 2. It never treats `agent_status` as completion. That reading was wrong\n *    twice in measured production: `idle` before the agent had started at\n *    all, and an `idle`-looking dip between two tool calls of one turn.\n *    Completion is `outbox/result-<round>.json` existing, nothing else.\n *\n * 3. It never closes the pane on failure. A failed dispatch's pane is the\n *    only place the reason is still legible, so it stays open and the error\n *    carries its id.\n *\n * HARD CONSTRAINT (tsk-1nih, live evidence): always a FRESH pane, never a\n * reused one. Delivering a dispatch into a finished worker's pane sends it\n * as chat to an idle REPL.\n *\n * Startup goes through `herdr agent start`, which returns only once herdr\n * has confirmed a ready agent in the pane -- that is what absorbs the shell\n * boot race the old path had to poll around, and it fails by name\n * (`agent_not_ready`) instead of hanging.\n */\nfunction herdrSpawnInteractiveAdapter(invocation, opts) {\n  const { command, args, argsTemplate, prompt, env: rawEnv, interactiveMode, promptDelivery, permissionMode, confinement } = invocation;\n  const { exitCommand, kind, usageLimitPatterns, trustStore } = interactiveMode;\n  const {\n    cwd, timeoutMs, idleTimeoutMs, workId, tier, model,\n    herdrBin: optsHerdrBin, onChunk, runDir: optsRunDir,\n    // An automated sweep may close the panes of failed rounds. It never\n    // closes one paused on a provider limit -- that screen is the only place\n    // the reset time is written.\n    closeAlways = false,\n    // A pane already sitting in the caller's own tab (one lead's coding panel",
      "excerptDigest": "b679003cd19161a05914a0adbfae3d83da9a5854d59b81cb92e5c61e2a91799b"
    },
    {
      "path": "src/runner/dispatch/transport.mjs",
      "beforeBlob": "acd13397a165d98cf3b5ef3d55b90ce9cf05db93",
      "afterBlob": "f806a07c208793bf5717dfd9a553ff87f6f6ef5c",
      "beforeStartLine": 915,
      "beforeEndLine": 923,
      "startLine": 937,
      "endLine": 945,
      "status": "unchanged-excerpt",
      "excerpt": "export function herdrSpawnAdapter(invocation, opts) {\n  if (invocation.interactiveMode) {\n    return herdrSpawnInteractiveAdapter(invocation, opts);\n  }\n  return Promise.reject(new DispatchError(\n    'invalid-config',\n    `executor for work \"${opts?.workId}\" refused: herdr-spawn adapter requires interactiveMode to be configured -- it no longer supports a non-interactive dispatch path.`,\n    { workId: opts?.workId, tier: opts?.tier, model: opts?.model },\n  ));",
      "excerptDigest": "a8d68b734f0a5656c2187d8542146814c7394b144b74b1a22842a530d294ea12"
    }
  ],
  "receiptArtifact": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-sync-repin.json",
  "receiptCommit": "6c6a65e8543fa72012bd55f8999f13f9ed6193c4",
  "meaning": "Machine exact cited-byte and non-pin-field comparison only; no truth re-review."
}
```

### Complete source / predecessor

Path/anchor: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-136
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 320e0ee20283f6f05f4296c40ae7077e943deffd6d41f49c7069c673f0a7b546
Shown text SHA256: 320e0ee20283f6f05f4296c40ae7077e943deffd6d41f49c7069c673f0a7b546
Lines: 752 to 752

```text
Implemented behavior:
```

### Complete target / successor

Path/anchor: docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#unheaded-block-136
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 320e0ee20283f6f05f4296c40ae7077e943deffd6d41f49c7069c673f0a7b546
Shown text SHA256: 320e0ee20283f6f05f4296c40ae7077e943deffd6d41f49c7069c673f0a7b546
Lines: 752 to 752

```text
Implemented behavior:
```

### Full diff

```diff

```

## receipt-claim_b1d5d70ac659fb59d22bad3f64ef18a5-s2-agent-coordination-truth-classifications

Entry kind: code-receipt-accounting
Class: Judgment
Source digest: ff82964f0bf928aa2ed499e59bd21fcdada6856a7c9c8205e69c76a78c36a90d
Target digest: ff82964f0bf928aa2ed499e59bd21fcdada6856a7c9c8205e69c76a78c36a90d

### Merge accounting

````json
{
  "mode": "candidate-unverified",
  "originalReviewedRef": {
    "claimId": "claim_b1d5d70ac659fb59d22bad3f64ef18a5",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "reviewed",
    "reviewNote": "architecture/evidence-and-results.md#evidence-and-result-architecture: receipt evidence-and-result-architecture (1-1): shown text is true now, header and snapshot link resolve (list-doc-anchors --check ok) and the Related paths exist",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
    "reviewedAt": "2026-10-10",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
    "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea"
  },
  "currentPendingRef": {
    "claimId": "claim_b1d5d70ac659fb59d22bad3f64ef18a5",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "pending",
    "pendingReason": "A31 cited code changed; old receipt stays immutable history, current native unit candidate-unverified under A28; full truth check owed at promotion."
  },
  "completeOldReceipt": {
    "claimId": "claim_b1d5d70ac659fb59d22bad3f64ef18a5",
    "path": "docs/platform/agent-coordination/architecture/evidence-and-results.md",
    "anchor": "evidence-and-result-architecture",
    "unitDigest": "ff82964f0bf928aa2ed499e59bd21fcdada6856a7c9c8205e69c76a78c36a90d",
    "shownText": "# Evidence And Result Architecture\n\n```txt\nDocument type: Architecture\nAudience: Maintainer, implementation agent and independent reviewer\nPurpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history\nDesign status: Candidate\nImplementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims\nProvenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review\nWriter type: Human + agent coauthor\nCanonical for: The current subject and design boundaries stated in this file; not retired engine authority\nUse this when: Reading the surviving contract, its implementation limits or current proposals\nDo not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior\nLast reviewed: Pending independent liveness re-review\nRelated:\n- docs/platform/agent-coordination/README.md\n- docs/specs/runner.md\nSupersedes: Incorrect whole-file retirement or over-removal only\nSuperseded by: None for the surviving current subject\nAdded in candidate: Liveness evidence and explicit implementation/proposal distinction\n```\n\nComplete pre-rework input: [historical snapshot](../history/retired-engine/files/architecture/evidence-and-results.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.",
    "shownTextDigest": "cff40eaf6b50c007e3c5f3505af8585621bc443d3a0b9ef60b77b75a0dc0a4c3",
    "class": "candidate-native-content",
    "authoredBy": "codex-session:1@2026-10-10",
    "rationale": "This current unit belongs to the truth-only section Evidence And Result Architecture, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: verified. No prior verdict is carried to this receipt.",
    "truthSection": {
      "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
      "anchor": "evidence-and-result-architecture",
      "status": "verified",
      "reason": null
    },
    "currentEvidence": {
      "commit": "af6c116f0e2af1f31f5e1d57830dc60de0c65411",
      "finding": "true-and-current",
      "citations": [
        {
          "path": "src/runner/dispatch/run-result.mjs",
          "startLine": 1245,
          "endLine": 1330,
          "blobSha": "a08dc676045d3775598287963ff8c157b5fabcba"
        },
        {
          "path": "src/runner/dispatch/evidence-attribution.mjs",
          "startLine": 31,
          "endLine": 83,
          "blobSha": "73dc6379b50bc0a02dc9742873607d89ad4a1056"
        }
      ],
      "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. The specific current code/consumer boundary is checked in the cited section.",
      "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
    }
  },
  "allCitationComparisons": [
    {
      "path": "src/runner/dispatch/run-result.mjs",
      "beforeBlob": "a08dc676045d3775598287963ff8c157b5fabcba",
      "afterBlob": "6f2c075c91efdc24601f13274bc8fa9a71d65513",
      "beforeStartLine": 1245,
      "beforeEndLine": 1330,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "  const workerArtifacts = Array.isArray(evidenceFloor.workerArtifacts) ? evidenceFloor.workerArtifacts : [];\n  const changedFiles = Array.isArray(evidenceFloor.changedFiles) ? evidenceFloor.changedFiles : [];\n  const hasDirtyBeforeMutation = evidenceFloor.hasDirtyBeforeMutation === true;\n  const isReadOnlyOperation = evidenceFloor.isReadOnlyOperation === true;\n\n  if (isTimeout || (exitCode !== null && exitCode !== undefined && exitCode !== 0) || signal) {\n    return { status: 'failed', confidence: 'failed' };\n  }\n  if (claimInvalid) {\n    return { status: 'failed', confidence: 'failed' };\n  }\n  const companionReportArtifacts = workerArtifacts.filter(\n    (p) => typeof p === 'string' && !p.endsWith('agent-result.json') && !/[/\\\\]outbox[/\\\\]result-\\d+\\.json$/.test(p),\n  );\n  const hasWorkerReport = companionReportArtifacts.length > 0;\n\n  if (agentClaim?.status === 'failed') {\n    const isFindingVerdict = agentClaim?.assessment?.verdict === 'findings';\n    if (isFindingVerdict && hasWorkerReport && exitCode === 0 && !isTimeout) {\n      return { status: 'failed', confidence: 'reported' };\n    }\n    return { status: 'failed', confidence: 'failed' };\n  }\n\n  const hasExternalEvidence = changedFiles.length > 0 || hasDirtyBeforeMutation;\n  if (isReadOnlyOperation && hasExternalEvidence) {\n    return { status: 'failed', confidence: 'failed' };\n  }\n  if (agentClaim?.status === 'blocked') {\n    return { status: 'blocked', confidence: 'reported' };\n  }\n  if (agentClaim && agentClaim.status === 'done') {\n    if (isReadOnlyOperation) {\n      return hasWorkerReport ? { status: 'done', confidence: 'reported' } : { status: 'no-evidence', confidence: 'no-evidence' };\n    }\n    return hasExternalEvidence ? { status: 'done', confidence: 'verified' } : { status: 'no-evidence', confidence: 'no-evidence' };\n  }\n  if (!isReadOnlyOperation && hasExternalEvidence) {\n    return { status: 'done', confidence: 'inferred' };\n  }\n  return { status: 'no-evidence', confidence: 'no-evidence' };\n}\n/**\n * Unified helper for reading RunResult outcome.\n * Single path for all dispatch, coordination, loop, show, and legality decisions.\n *\n * @param {object|string} resultOrPath\n * @param {object} [options]\n * @param {object} [options.evidenceFloor]\n * @returns {Readonly<{\n *   category: 'ok'|'infra'|'verdict'|'policy'|'blocked'|'corrupt',\n *   executed: 'completed'|'failed'|'cancelled'|'unknown',\n *   verdict: 'pass'|'findings'|'blocked'|'inconclusive'|'not-applicable',\n *   refused: boolean,\n *   evidence: 'verified'|'reported'|'inferred'|'none'|'failed',\n *   satisfied: boolean,\n *   infraFailure: boolean,\n *   failure: object|null\n * }>}\n */\nexport function runOutcome(resultOrPath, { evidenceFloor } = {}) {\n  const derivedFloor = evidenceFloor && typeof evidenceFloor === 'object' ? deriveEvidenceFloor(evidenceFloor) : null;\n  const result = typeof resultOrPath === 'string'\n    ? interpretRunResult(resultOrPath)\n    : (resultOrPath?.classification !== undefined || resultOrPath?.contract !== undefined\n      ? interpretRunResult(resultOrPath)\n      : interpretRunResult(resultOrPath));\n\n  // Fail-closed with corrupt records\n  if (\n    !result ||\n    result.corrupt ||\n    result.contractCorrupt ||\n    result.resultCorrupt ||\n    result.classification?.provenance === 'contract-corrupt'\n  ) {\n    const evidenceLevel = (derivedFloor?.confidence === 'no-evidence' || derivedFloor?.status === 'no-evidence')\n      ? 'no-evidence'\n      : 'failed';\n    return Object.freeze({\n      category: 'corrupt',\n      executed: 'unknown',\n      verdict: 'inconclusive',\n      refused: true,\n      evidence: evidenceLevel,\n      satisfied: false,",
      "excerptDigest": "50c8e2860e27e28e74a040303380d35ddd58d360dc41d7ec4017bc750a3e192e"
    },
    {
      "path": "src/runner/dispatch/evidence-attribution.mjs",
      "beforeBlob": "73dc6379b50bc0a02dc9742873607d89ad4a1056",
      "afterBlob": "e09504371a539816e5195f4b33a87f0c158c07ad",
      "beforeStartLine": 31,
      "beforeEndLine": 83,
      "startLine": 33,
      "endLine": 85,
      "status": "unchanged-excerpt",
      "excerpt": "export function attributeWorkspaceChanges({\n  preLaunchDirt = [],\n  postRunDirt = [],\n  dirtyBeforeHashes = {},\n  postRunHashes = {},\n  declaredCoverage = null,\n  adapterAttestation = null,\n} = {}) {\n  const records = [];\n  const preDirtSet = new Set(preLaunchDirt || []);\n  const postDirtSet = new Set(postRunDirt || []);\n\n  const allPaths = Array.from(new Set([...preDirtSet, ...postDirtSet])).sort();\n\n  for (const filePath of allPaths) {\n    const wasPre = preDirtSet.has(filePath);\n    const isPost = postDirtSet.has(filePath);\n\n    if (wasPre && isPost) {\n      const preHash = dirtyBeforeHashes[filePath];\n      const postHash = postRunHashes[filePath];\n\n      if (preHash && postHash && preHash === postHash) {\n        // Pre-existing dirt unchanged during run -> excluded\n        records.push({\n          path: filePath,\n          firstObserved: 'pre-launch',\n          level: 'excluded',\n          basis: ['dirty-before-hash-match'],\n          coverageMatched: false,\n        });\n      } else if (preHash && postHash && preHash !== postHash) {\n        // Pre-existing dirt mutated during run -> correlated (or proven if covered)\n        const isCovered = checkCoverage(filePath, declaredCoverage);\n        const hasPositiveAttestation = checkAttestation(filePath, adapterAttestation);\n        records.push({\n          path: filePath,\n          firstObserved: 'pre-launch',\n          level: hasPositiveAttestation && isCovered ? 'proven' : 'correlated',\n          basis: hasPositiveAttestation && isCovered\n            ? ['adapter-confinement-attestation', 'pre-existing-dirt-mutated']\n            : ['pre-existing-dirt-mutated', 'pre-post-git-snapshot'],\n          coverageMatched: isCovered,\n        });\n      } else {\n        // Hashes missing but present in both -> excluded by default timing unless mutatedDirtyBeforeFiles says otherwise\n        records.push({\n          path: filePath,\n          firstObserved: 'pre-launch',\n          level: 'excluded',\n          basis: ['pre-launch-git-status'],\n          coverageMatched: false,\n        });",
      "excerptDigest": "fdff7cd499c0b8c6010af6e6c900a72cbb2e915f2810f7b7fedc3a6a22416b0a"
    }
  ],
  "receiptArtifact": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-sync-repin.json",
  "receiptCommit": "6c6a65e8543fa72012bd55f8999f13f9ed6193c4",
  "meaning": "Cited code changed; receipt remains immutable history, current unit candidate-unverified; no truth re-verification."
}
````

### Complete source / predecessor

Path/anchor: docs/platform/agent-coordination/architecture/evidence-and-results.md#evidence-and-result-architecture
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: ff82964f0bf928aa2ed499e59bd21fcdada6856a7c9c8205e69c76a78c36a90d
Shown text SHA256: cff40eaf6b50c007e3c5f3505af8585621bc443d3a0b9ef60b77b75a0dc0a4c3
Lines: 1 to 1

````text
# Evidence And Result Architecture

```txt
Document type: Architecture
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/architecture/evidence-and-results.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
````

### Complete target / successor

Path/anchor: docs/platform/agent-coordination/architecture/evidence-and-results.md#evidence-and-result-architecture
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: ff82964f0bf928aa2ed499e59bd21fcdada6856a7c9c8205e69c76a78c36a90d
Shown text SHA256: cff40eaf6b50c007e3c5f3505af8585621bc443d3a0b9ef60b77b75a0dc0a4c3
Lines: 1 to 1

````text
# Evidence And Result Architecture

```txt
Document type: Architecture
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/architecture/evidence-and-results.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
````

### Full diff

```diff

```

## receipt-claim_8274133f261570d687a3d99c259c4680-s2-agent-coordination-truth-classifications

Entry kind: code-receipt-accounting
Class: Judgment
Source digest: 0a88175507f42a6a959a7346b27c6d42bc8bbd845d2a9162f4d438081839c669
Target digest: 0a88175507f42a6a959a7346b27c6d42bc8bbd845d2a9162f4d438081839c669

### Merge accounting

````json
{
  "mode": "candidate-unverified",
  "originalReviewedRef": {
    "claimId": "claim_8274133f261570d687a3d99c259c4680",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "reviewed",
    "reviewNote": "architecture/work-integration.md#work-integration-boundaries: Title and metadata (lines 1-1) label the document Architecture/Candidate with section-specific implementation, an honest bound; no runtime claim.",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
    "reviewedAt": "2026-10-10",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
    "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea"
  },
  "currentPendingRef": {
    "claimId": "claim_8274133f261570d687a3d99c259c4680",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "pending",
    "pendingReason": "A31 cited code changed; old receipt stays immutable history, current native unit candidate-unverified under A28; full truth check owed at promotion."
  },
  "completeOldReceipt": {
    "claimId": "claim_8274133f261570d687a3d99c259c4680",
    "path": "docs/platform/agent-coordination/architecture/work-integration.md",
    "anchor": "work-integration-boundaries",
    "unitDigest": "0a88175507f42a6a959a7346b27c6d42bc8bbd845d2a9162f4d438081839c669",
    "shownText": "# Work Integration Boundaries\n\n```txt\nDocument type: Architecture\nAudience: Maintainer, implementation agent and independent reviewer\nPurpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history\nDesign status: Candidate\nImplementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims\nProvenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review\nWriter type: Human + agent coauthor\nCanonical for: The current subject and design boundaries stated in this file; not retired engine authority\nUse this when: Reading the surviving contract, its implementation limits or current proposals\nDo not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior\nLast reviewed: Pending independent liveness re-review\nRelated:\n- docs/platform/agent-coordination/README.md\n- docs/specs/runner.md\nSupersedes: Incorrect whole-file retirement or over-removal only\nSuperseded by: None for the surviving current subject\nAdded in candidate: Liveness evidence and explicit implementation/proposal distinction\n```\n\nComplete pre-rework input: [historical snapshot](../history/retired-engine/files/architecture/work-integration.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.",
    "shownTextDigest": "87a8d48845b24d1ce6a08e6cdc77f98bdbf914747bfa10209adde5ab73cb5a8b",
    "class": "candidate-native-content",
    "authoredBy": "codex-session:1@2026-10-10",
    "rationale": "This current unit belongs to the truth-only section Work Integration Boundaries, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: verified. No prior verdict is carried to this receipt.",
    "truthSection": {
      "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
      "anchor": "work-integration-boundaries",
      "status": "verified",
      "reason": null
    },
    "currentEvidence": {
      "commit": "af6c116f0e2af1f31f5e1d57830dc60de0c65411",
      "finding": "true-and-current",
      "citations": [
        {
          "path": "src/state/work.mjs",
          "startLine": 445,
          "endLine": 467,
          "blobSha": "154507cc747a6e83f3abc215c83f560cb02f459a"
        },
        {
          "path": "src/workflow/runner.mjs",
          "startLine": 419,
          "endLine": 428,
          "blobSha": "82f25b3dc6a5d8121874ec75566fb439b751edc5"
        },
        {
          "path": "test/runner/dispatch-reconciliation-import-graph.test.mjs",
          "startLine": 434,
          "endLine": 443,
          "blobSha": "1028a7279ac95a48f6075d239f36f5cf250ec58f"
        }
      ],
      "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. The specific current code/consumer boundary is checked in the cited section.",
      "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
    }
  },
  "allCitationComparisons": [
    {
      "path": "src/workflow/runner.mjs",
      "beforeBlob": "82f25b3dc6a5d8121874ec75566fb439b751edc5",
      "afterBlob": "cda214f0e07b136e8ab1bca43f149a3a12cdac9f",
      "beforeStartLine": 419,
      "beforeEndLine": 428,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "          try {\n            unitRunResult = await runUnit({\n              unitData,\n              repoRoot: mainRoot,\n              cwd: unitWorktree,\n              worktree: unitWorktree,\n              pattern: unitPatternOf(u.template),\n              overrides: unitOverridesOf(u),\n              workflow: { runId: workflowRunId, stepId: step.id, unitId: u.id },\n            });",
      "excerptDigest": "464bfcfeea7fc87f66d4867e9c9b44be401a2d6973a48cce279949ef41939cac"
    }
  ],
  "receiptArtifact": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-sync-repin.json",
  "receiptCommit": "6c6a65e8543fa72012bd55f8999f13f9ed6193c4",
  "meaning": "Cited code changed; receipt remains immutable history, current unit candidate-unverified; no truth re-verification."
}
````

### Complete source / predecessor

Path/anchor: docs/platform/agent-coordination/architecture/work-integration.md#work-integration-boundaries
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 0a88175507f42a6a959a7346b27c6d42bc8bbd845d2a9162f4d438081839c669
Shown text SHA256: 87a8d48845b24d1ce6a08e6cdc77f98bdbf914747bfa10209adde5ab73cb5a8b
Lines: 1 to 1

````text
# Work Integration Boundaries

```txt
Document type: Architecture
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/architecture/work-integration.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
````

### Complete target / successor

Path/anchor: docs/platform/agent-coordination/architecture/work-integration.md#work-integration-boundaries
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 0a88175507f42a6a959a7346b27c6d42bc8bbd845d2a9162f4d438081839c669
Shown text SHA256: 87a8d48845b24d1ce6a08e6cdc77f98bdbf914747bfa10209adde5ab73cb5a8b
Lines: 1 to 1

````text
# Work Integration Boundaries

```txt
Document type: Architecture
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/architecture/work-integration.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
````

### Full diff

```diff

```

## receipt-claim_32f1855de59cc4ae4f957e5af1ccb12d-s2-agent-coordination-truth-classifications

Entry kind: code-receipt-accounting
Class: Judgment
Source digest: 1b900f3ed9bf1b88166ca2f33d7ab6d95d0344d3d791c2547e748bda1fd46e6b
Target digest: 1b900f3ed9bf1b88166ca2f33d7ab6d95d0344d3d791c2547e748bda1fd46e6b

### Merge accounting

````json
{
  "mode": "candidate-unverified",
  "originalReviewedRef": {
    "claimId": "claim_32f1855de59cc4ae4f957e5af1ccb12d",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "reviewed",
    "reviewNote": "contracts/assignment-run-runresult.md#assignment-run-and-runresult-contract: unit assignment-run-and-runresult-contract (lines 1-1) in section assignment-run-and-runresult-contract: text is true now or honestly labeled; check: header block and snapshot link resolve (list-doc-anchors ok for the literal-snapshot anchor); scope statement is bounded and matches code that exists in assignment-runner.mjs and run-result.mjs",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
    "reviewedAt": "2026-10-10",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
    "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea"
  },
  "currentPendingRef": {
    "claimId": "claim_32f1855de59cc4ae4f957e5af1ccb12d",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "pending",
    "pendingReason": "A31 cited code changed; old receipt stays immutable history, current native unit candidate-unverified under A28; full truth check owed at promotion."
  },
  "completeOldReceipt": {
    "claimId": "claim_32f1855de59cc4ae4f957e5af1ccb12d",
    "path": "docs/platform/agent-coordination/contracts/assignment-run-runresult.md",
    "anchor": "assignment-run-and-runresult-contract",
    "unitDigest": "1b900f3ed9bf1b88166ca2f33d7ab6d95d0344d3d791c2547e748bda1fd46e6b",
    "shownText": "# Assignment, Run, And RunResult Contract\n\n```txt\nDocument type: Contract\nAudience: Maintainer, implementation agent and independent reviewer\nPurpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history\nDesign status: Candidate\nImplementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims\nProvenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review\nWriter type: Human + agent coauthor\nCanonical for: The current subject and design boundaries stated in this file; not retired engine authority\nUse this when: Reading the surviving contract, its implementation limits or current proposals\nDo not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior\nLast reviewed: Pending independent liveness re-review\nRelated:\n- docs/platform/agent-coordination/README.md\n- docs/specs/runner.md\nSupersedes: Incorrect whole-file retirement or over-removal only\nSuperseded by: None for the surviving current subject\nAdded in candidate: Liveness evidence and explicit implementation/proposal distinction\n```\n\nComplete pre-rework input: [historical snapshot](../history/retired-engine/files/contracts/assignment-run-runresult.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.",
    "shownTextDigest": "d73b37898c78ff58bb1a6f4f56396de435ad04c43c27b2e2e5cecff43d9a8f58",
    "class": "candidate-native-content",
    "authoredBy": "codex-session:1@2026-10-11",
    "rationale": "The native unit belongs to a verified truth-ledger section. Every prior cited code excerpt is located byte-identically and uniquely in the actual current blob, with fresh line/blob pins. Independent review must check the complete shown unit against those current citations, including proposal/current boundaries; no previous approval carries.",
    "currentEvidence": {
      "commit": "e931b74c3ffd2b02d1cb00a1e0f610ff998acb5d",
      "finding": "true-and-current",
      "citations": [
        {
          "path": "src/runner/dispatch/assignment-runner.mjs",
          "startLine": 1550,
          "endLine": 1595,
          "blobSha": "8489abd5368457a7bc8ac54b506d7e48183adc5f"
        },
        {
          "path": "src/runner/dispatch/run-result.mjs",
          "startLine": 1245,
          "endLine": 1330,
          "blobSha": "a08dc676045d3775598287963ff8c157b5fabcba"
        },
        {
          "path": "src/runner/execution/run.mjs",
          "startLine": 334,
          "endLine": 343,
          "blobSha": "98ab4b4c2124285530c3ff676e6eb2864c6baef2"
        }
      ],
      "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
      "scope": "Complete native shown text; verified parent section Assignment, Run, And RunResult Contract"
    },
    "priorTruthSection": {
      "anchor": "assignment-run-and-runresult-contract",
      "shownTextDigest": "d73b37898c78ff58bb1a6f4f56396de435ad04c43c27b2e2e5cecff43d9a8f58",
      "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-current.md"
    },
    "translatedEvidence": [
      {
        "path": "src/runner/dispatch/assignment-runner.mjs",
        "startLine": 1550,
        "endLine": 1595,
        "blobSha": "8489abd5368457a7bc8ac54b506d7e48183adc5f",
        "priorEvidence": "src/runner/dispatch/assignment-runner.mjs:1550-1595",
        "excerptSha256": "34d90f3737554a096f81636d0ae22729e9db4fbff48a890ba32bf686f6b726aa"
      },
      {
        "path": "src/runner/dispatch/run-result.mjs",
        "startLine": 1245,
        "endLine": 1330,
        "blobSha": "a08dc676045d3775598287963ff8c157b5fabcba",
        "priorEvidence": "src/runner/dispatch/run-result.mjs:1245-1330",
        "excerptSha256": "50c8e2860e27e28e74a040303380d35ddd58d360dc41d7ec4017bc750a3e192e"
      },
      {
        "path": "src/runner/execution/run.mjs",
        "startLine": 334,
        "endLine": 343,
        "blobSha": "98ab4b4c2124285530c3ff676e6eb2864c6baef2",
        "priorEvidence": "src/runner/execution/run.mjs:331-340",
        "excerptSha256": "c342412e8bfcfd827b25c3acbe23e02b5720070b0159481a35487b4b931f3d6b"
      }
    ]
  },
  "allCitationComparisons": [
    {
      "path": "src/runner/dispatch/assignment-runner.mjs",
      "beforeBlob": "8489abd5368457a7bc8ac54b506d7e48183adc5f",
      "afterBlob": "09c15586c0bdb771bc1fed5142df6bfe3671fd4a",
      "beforeStartLine": 1550,
      "beforeEndLine": 1595,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "    destination: opts.destination ?? effectiveCwd,\n    payloadDigest: opts.payloadDigest ?? defaultAdmissionPayloadDigest,\n    expectedRunId: opts.expectedRunId,\n    herdrLivenessPreCheck,\n    // M1: operator escape valve for a prior attempt this host can no\n    // longer observe correctly (e.g. its control ledger identity is on an\n    // unreachable filesystem) -- never the default, always an explicit opt\n    // sourced from the caller (CLI: --force-new-attempt).\n    forceNewAttempt: opts.forceNewAttempt === true,\n    // S5: opt-in only (session-engine.mjs's own FRESH, non-retry dispatch\n    // path) -- see admitRunAttempt's own comment for why this exists.\n    refuseIfSettled: opts.refuseIfSettled === true,\n    buildRunMeta: (record) => ({\n      contract: 'assignment-run.v2',\n      runId: record.runId,\n      assignmentId: effectiveAssignment.assignmentId,\n      attempt: record.attempt,\n      supersedesRunId: record.predecessorRunId ?? null,\n      retryId: record.retryId ?? null,\n      payloadDigest: record.admissionPayloadDigest ? (record.admissionPayloadDigest.startsWith('sha256:') ? record.admissionPayloadDigest : `sha256:${record.admissionPayloadDigest}`) : null,\n      dispatchPlanDigest: compiledPlan ? `sha256:${crypto.createHash('sha256').update(JSON.stringify(compiledPlan)).digest('hex')}` : null,\n      phase: 'admitted',\n      delivery: 'not-sent',\n      executorId: resolvedExecutorId,\n      ...(templateResolution ? { template: templateResolution.templateProvenance } : (effectiveAssignment.provenance?.template ? { template: effectiveAssignment.provenance.template } : {})),\n      ...(compiledPlan ? { dispatchPlanPath: path.relative(root, path.join(runsDir, record.attemptStr, 'dispatch-plan.json')) } : {}),\n      effectiveContractPath: path.relative(root, path.join(runsDir, record.attemptStr, EFFECTIVE_EXECUTION_CONTRACT_FILE)),\n      ...(planContentHash ? { planContentHash } : {}),\n      cwd,\n      startedAt,\n      timeoutMs,\n      status: 'running',\n    }),\n    buildDispatchPlan: () => compiledPlan,\n  });\n  const { attemptStr, runId, runDir } = admitted;\n  const dispatchPlanPath = path.join(runDir, 'dispatch-plan.json');\n  const effectiveContractPath = path.join(runDir, EFFECTIVE_EXECUTION_CONTRACT_FILE);\n  let providerCapacitySelection = null;\n  let providerCapacityEvidence = null;\n  let fallbackEvidence = null;\n  // executor-id-consolidation Step 2: true once `resolvedExecutorId` has\n  // been substituted away from `declaredPrimaryExecutorId` by the\n  // provider-capacity fallback mechanism specifically (resume rehydration\n  // below, or a live fallback adoption further down) -- deliberately NEVER\n  // set by the read-only-redirect substitution above, which is a separate,",
      "excerptDigest": "34d90f3737554a096f81636d0ae22729e9db4fbff48a890ba32bf686f6b726aa"
    },
    {
      "path": "src/runner/dispatch/run-result.mjs",
      "beforeBlob": "a08dc676045d3775598287963ff8c157b5fabcba",
      "afterBlob": "6f2c075c91efdc24601f13274bc8fa9a71d65513",
      "beforeStartLine": 1245,
      "beforeEndLine": 1330,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "  const workerArtifacts = Array.isArray(evidenceFloor.workerArtifacts) ? evidenceFloor.workerArtifacts : [];\n  const changedFiles = Array.isArray(evidenceFloor.changedFiles) ? evidenceFloor.changedFiles : [];\n  const hasDirtyBeforeMutation = evidenceFloor.hasDirtyBeforeMutation === true;\n  const isReadOnlyOperation = evidenceFloor.isReadOnlyOperation === true;\n\n  if (isTimeout || (exitCode !== null && exitCode !== undefined && exitCode !== 0) || signal) {\n    return { status: 'failed', confidence: 'failed' };\n  }\n  if (claimInvalid) {\n    return { status: 'failed', confidence: 'failed' };\n  }\n  const companionReportArtifacts = workerArtifacts.filter(\n    (p) => typeof p === 'string' && !p.endsWith('agent-result.json') && !/[/\\\\]outbox[/\\\\]result-\\d+\\.json$/.test(p),\n  );\n  const hasWorkerReport = companionReportArtifacts.length > 0;\n\n  if (agentClaim?.status === 'failed') {\n    const isFindingVerdict = agentClaim?.assessment?.verdict === 'findings';\n    if (isFindingVerdict && hasWorkerReport && exitCode === 0 && !isTimeout) {\n      return { status: 'failed', confidence: 'reported' };\n    }\n    return { status: 'failed', confidence: 'failed' };\n  }\n\n  const hasExternalEvidence = changedFiles.length > 0 || hasDirtyBeforeMutation;\n  if (isReadOnlyOperation && hasExternalEvidence) {\n    return { status: 'failed', confidence: 'failed' };\n  }\n  if (agentClaim?.status === 'blocked') {\n    return { status: 'blocked', confidence: 'reported' };\n  }\n  if (agentClaim && agentClaim.status === 'done') {\n    if (isReadOnlyOperation) {\n      return hasWorkerReport ? { status: 'done', confidence: 'reported' } : { status: 'no-evidence', confidence: 'no-evidence' };\n    }\n    return hasExternalEvidence ? { status: 'done', confidence: 'verified' } : { status: 'no-evidence', confidence: 'no-evidence' };\n  }\n  if (!isReadOnlyOperation && hasExternalEvidence) {\n    return { status: 'done', confidence: 'inferred' };\n  }\n  return { status: 'no-evidence', confidence: 'no-evidence' };\n}\n/**\n * Unified helper for reading RunResult outcome.\n * Single path for all dispatch, coordination, loop, show, and legality decisions.\n *\n * @param {object|string} resultOrPath\n * @param {object} [options]\n * @param {object} [options.evidenceFloor]\n * @returns {Readonly<{\n *   category: 'ok'|'infra'|'verdict'|'policy'|'blocked'|'corrupt',\n *   executed: 'completed'|'failed'|'cancelled'|'unknown',\n *   verdict: 'pass'|'findings'|'blocked'|'inconclusive'|'not-applicable',\n *   refused: boolean,\n *   evidence: 'verified'|'reported'|'inferred'|'none'|'failed',\n *   satisfied: boolean,\n *   infraFailure: boolean,\n *   failure: object|null\n * }>}\n */\nexport function runOutcome(resultOrPath, { evidenceFloor } = {}) {\n  const derivedFloor = evidenceFloor && typeof evidenceFloor === 'object' ? deriveEvidenceFloor(evidenceFloor) : null;\n  const result = typeof resultOrPath === 'string'\n    ? interpretRunResult(resultOrPath)\n    : (resultOrPath?.classification !== undefined || resultOrPath?.contract !== undefined\n      ? interpretRunResult(resultOrPath)\n      : interpretRunResult(resultOrPath));\n\n  // Fail-closed with corrupt records\n  if (\n    !result ||\n    result.corrupt ||\n    result.contractCorrupt ||\n    result.resultCorrupt ||\n    result.classification?.provenance === 'contract-corrupt'\n  ) {\n    const evidenceLevel = (derivedFloor?.confidence === 'no-evidence' || derivedFloor?.status === 'no-evidence')\n      ? 'no-evidence'\n      : 'failed';\n    return Object.freeze({\n      category: 'corrupt',\n      executed: 'unknown',\n      verdict: 'inconclusive',\n      refused: true,\n      evidence: evidenceLevel,\n      satisfied: false,",
      "excerptDigest": "50c8e2860e27e28e74a040303380d35ddd58d360dc41d7ec4017bc750a3e192e"
    },
    {
      "path": "src/runner/execution/run.mjs",
      "beforeBlob": "98ab4b4c2124285530c3ff676e6eb2864c6baef2",
      "afterBlob": "47eb3fc3f389ef9f0c0f0136277da1e34c89bb8b",
      "beforeStartLine": 334,
      "beforeEndLine": 343,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "      objective,\n      mutation: readOnly ? 'read-only' : 'mutating',\n      binding: bound,\n      provenance: {\n        kind: 'unit-run',\n        unitRunId,\n        role,\n        round,\n        binding: bound,\n      },",
      "excerptDigest": "c342412e8bfcfd827b25c3acbe23e02b5720070b0159481a35487b4b931f3d6b"
    }
  ],
  "receiptArtifact": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-sync-repin.json",
  "receiptCommit": "6c6a65e8543fa72012bd55f8999f13f9ed6193c4",
  "meaning": "Cited code changed; receipt remains immutable history, current unit candidate-unverified; no truth re-verification."
}
````

### Complete source / predecessor

Path/anchor: docs/platform/agent-coordination/contracts/assignment-run-runresult.md#assignment-run-and-runresult-contract
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 1b900f3ed9bf1b88166ca2f33d7ab6d95d0344d3d791c2547e748bda1fd46e6b
Shown text SHA256: d73b37898c78ff58bb1a6f4f56396de435ad04c43c27b2e2e5cecff43d9a8f58
Lines: 1 to 1

````text
# Assignment, Run, And RunResult Contract

```txt
Document type: Contract
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/contracts/assignment-run-runresult.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
````

### Complete target / successor

Path/anchor: docs/platform/agent-coordination/contracts/assignment-run-runresult.md#assignment-run-and-runresult-contract
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 1b900f3ed9bf1b88166ca2f33d7ab6d95d0344d3d791c2547e748bda1fd46e6b
Shown text SHA256: d73b37898c78ff58bb1a6f4f56396de435ad04c43c27b2e2e5cecff43d9a8f58
Lines: 1 to 1

````text
# Assignment, Run, And RunResult Contract

```txt
Document type: Contract
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/contracts/assignment-run-runresult.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
````

### Full diff

```diff

```

## receipt-claim_89bf8dc27109a2ebb8ab8894f7ba6ca2-s2-agent-coordination-truth-classifications

Entry kind: code-receipt-accounting
Class: Judgment
Source digest: c38d0415d4b33774166265ec51186ac45281327432065f140095468a7c017972
Target digest: c38d0415d4b33774166265ec51186ac45281327432065f140095468a7c017972

### Merge accounting

````json
{
  "mode": "candidate-unverified",
  "originalReviewedRef": {
    "claimId": "claim_89bf8dc27109a2ebb8ab8894f7ba6ca2",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "reviewed",
    "reviewNote": "decisions/ADR-001-work-lifecycle-authority.md#adr-001-work-owns-delivery-lifecycle: ADR-001 title: matches the surviving Work-lifecycle invariant stated at assignment-runner.mjs:10.",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
    "reviewedAt": "2026-10-10",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
    "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea"
  },
  "currentPendingRef": {
    "claimId": "claim_89bf8dc27109a2ebb8ab8894f7ba6ca2",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "pending",
    "pendingReason": "A31 cited code changed; old receipt stays immutable history, current native unit candidate-unverified under A28; full truth check owed at promotion."
  },
  "completeOldReceipt": {
    "claimId": "claim_89bf8dc27109a2ebb8ab8894f7ba6ca2",
    "path": "docs/platform/agent-coordination/decisions/ADR-001-work-lifecycle-authority.md",
    "anchor": "adr-001-work-owns-delivery-lifecycle",
    "unitDigest": "c38d0415d4b33774166265ec51186ac45281327432065f140095468a7c017972",
    "shownText": "# ADR-001: Work Owns Delivery Lifecycle\n\n```txt\nDocument type: Decision\nAudience: Maintainer, implementation agent and independent reviewer\nPurpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history\nDesign status: Candidate\nImplementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims\nProvenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review\nWriter type: Human + agent coauthor\nCanonical for: The current subject and design boundaries stated in this file; not retired engine authority\nUse this when: Reading the surviving contract, its implementation limits or current proposals\nDo not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior\nLast reviewed: Pending independent liveness re-review\nRelated:\n- docs/platform/agent-coordination/README.md\n- docs/specs/runner.md\nSupersedes: Incorrect whole-file retirement or over-removal only\nSuperseded by: None for the surviving current subject\nAdded in candidate: Liveness evidence and explicit implementation/proposal distinction\n```\n\nComplete pre-rework input: [historical snapshot](../history/retired-engine/files/decisions/ADR-001-work-lifecycle-authority.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.",
    "shownTextDigest": "112613ea8854d2df7024eadaf5bf7bde0fa8eb6b86fe83accd717653856b71fc",
    "class": "candidate-native-content",
    "authoredBy": "codex-session:1@2026-10-10",
    "rationale": "This current unit belongs to the truth-only section ADR-001: Work Owns Delivery Lifecycle, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: verified. No prior verdict is carried to this receipt.",
    "truthSection": {
      "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
      "anchor": "adr-001-work-owns-delivery-lifecycle",
      "status": "verified",
      "reason": null
    },
    "currentEvidence": {
      "commit": "af6c116f0e2af1f31f5e1d57830dc60de0c65411",
      "finding": "true-and-current",
      "citations": [
        {
          "path": "src/state/work.mjs",
          "startLine": 445,
          "endLine": 467,
          "blobSha": "154507cc747a6e83f3abc215c83f560cb02f459a"
        },
        {
          "path": "src/workflow/runner.mjs",
          "startLine": 419,
          "endLine": 428,
          "blobSha": "82f25b3dc6a5d8121874ec75566fb439b751edc5"
        },
        {
          "path": "test/runner/dispatch-reconciliation-import-graph.test.mjs",
          "startLine": 434,
          "endLine": 443,
          "blobSha": "1028a7279ac95a48f6075d239f36f5cf250ec58f"
        }
      ],
      "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. The specific current code/consumer boundary is checked in the cited section.",
      "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
    }
  },
  "allCitationComparisons": [
    {
      "path": "src/workflow/runner.mjs",
      "beforeBlob": "82f25b3dc6a5d8121874ec75566fb439b751edc5",
      "afterBlob": "cda214f0e07b136e8ab1bca43f149a3a12cdac9f",
      "beforeStartLine": 419,
      "beforeEndLine": 428,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "          try {\n            unitRunResult = await runUnit({\n              unitData,\n              repoRoot: mainRoot,\n              cwd: unitWorktree,\n              worktree: unitWorktree,\n              pattern: unitPatternOf(u.template),\n              overrides: unitOverridesOf(u),\n              workflow: { runId: workflowRunId, stepId: step.id, unitId: u.id },\n            });",
      "excerptDigest": "464bfcfeea7fc87f66d4867e9c9b44be401a2d6973a48cce279949ef41939cac"
    }
  ],
  "receiptArtifact": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-sync-repin.json",
  "receiptCommit": "6c6a65e8543fa72012bd55f8999f13f9ed6193c4",
  "meaning": "Cited code changed; receipt remains immutable history, current unit candidate-unverified; no truth re-verification."
}
````

### Complete source / predecessor

Path/anchor: docs/platform/agent-coordination/decisions/ADR-001-work-lifecycle-authority.md#adr-001-work-owns-delivery-lifecycle
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: c38d0415d4b33774166265ec51186ac45281327432065f140095468a7c017972
Shown text SHA256: 112613ea8854d2df7024eadaf5bf7bde0fa8eb6b86fe83accd717653856b71fc
Lines: 1 to 1

````text
# ADR-001: Work Owns Delivery Lifecycle

```txt
Document type: Decision
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/decisions/ADR-001-work-lifecycle-authority.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
````

### Complete target / successor

Path/anchor: docs/platform/agent-coordination/decisions/ADR-001-work-lifecycle-authority.md#adr-001-work-owns-delivery-lifecycle
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: c38d0415d4b33774166265ec51186ac45281327432065f140095468a7c017972
Shown text SHA256: 112613ea8854d2df7024eadaf5bf7bde0fa8eb6b86fe83accd717653856b71fc
Lines: 1 to 1

````text
# ADR-001: Work Owns Delivery Lifecycle

```txt
Document type: Decision
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/decisions/ADR-001-work-lifecycle-authority.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
````

### Full diff

```diff

```

## receipt-claim_9786ce02129b75faa01d4b022dca1fe2-s2-agent-coordination-truth-classifications

Entry kind: code-receipt-accounting
Class: Judgment
Source digest: 212dcfd747c924d1e8ff5b65f47f0c146fec482bfe80818922875bea5c379e06
Target digest: 212dcfd747c924d1e8ff5b65f47f0c146fec482bfe80818922875bea5c379e06

### Merge accounting

````json
{
  "mode": "candidate-unverified",
  "originalReviewedRef": {
    "claimId": "claim_9786ce02129b75faa01d4b022dca1fe2",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "reviewed",
    "reviewNote": "spec.md#agent-coordination-spec: Unit agent-coordination-spec (lines 1-1) sits in section agent-coordination-spec: Metadata block and retirement commit 2180b4e72 (commit message: L4 coordination engine retired) verified; Related files all exist.",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
    "reviewedAt": "2026-10-10",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
    "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea"
  },
  "currentPendingRef": {
    "claimId": "claim_9786ce02129b75faa01d4b022dca1fe2",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "pending",
    "pendingReason": "A31 cited code changed; old receipt stays immutable history, current native unit candidate-unverified under A28; full truth check owed at promotion."
  },
  "completeOldReceipt": {
    "claimId": "claim_9786ce02129b75faa01d4b022dca1fe2",
    "path": "docs/platform/agent-coordination/spec.md",
    "anchor": "agent-coordination-spec",
    "unitDigest": "212dcfd747c924d1e8ff5b65f47f0c146fec482bfe80818922875bea5c379e06",
    "shownText": "# Agent Coordination Spec\n\n```txt\nDocument type: Spec\nAudience: Human reviewer, maintainer and implementation agent\nPurpose: Route current execution to its code and runner-spec owners, retaining verified boundaries\nDesign status: Candidate\nImplementation: Current execution is owned by CollaborationPattern and the Workflow runner\nProvenance: Whole-area reframe under owner A16; complete classified input preserved in history/retired-engine/files\nWriter type: Human + agent coauthor\nCanonical for: Current-owner navigation and verified boundaries; not a second runtime specification\nUse this when: Locating current execution owners or auditing historical claims\nDo not use this for: Reinstating CoordinationSession, CoordinationProtocol or FlowDefinition as current implementation\nLast reviewed: Pending independent whole-area review\nRelated:\n- docs/platform/agent-coordination/README.md\n- docs/specs/runner.md\n- docs/platform/agent-coordination/history/retired-engine/spec.md\nSupersedes: Stale current-state framing only; all old claims are preserved verbatim\nSuperseded by: Runtime ownership in docs/specs/runner.md\nAdded in candidate: Retirement framing and current-owner navigation\n```\n\nThe coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`. This page routes current execution to [the runner spec](../../specs/runner.md) and preserves verified boundaries; the [complete former spec](history/retired-engine/spec.md#literal-snapshot) is non-authority history.",
    "shownTextDigest": "2e6ebf15563276468332ff447b1a4119804ea631c94315ae9d7144d605d5f9c9",
    "class": "candidate-native-content",
    "authoredBy": "codex-session:1@2026-10-10",
    "rationale": "This current unit belongs to the truth-only section Agent Coordination Spec, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: verified. No prior verdict is carried to this receipt.",
    "truthSection": {
      "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
      "anchor": "agent-coordination-spec",
      "status": "verified",
      "reason": null
    },
    "currentEvidence": {
      "commit": "af6c116f0e2af1f31f5e1d57830dc60de0c65411",
      "finding": "true-and-current",
      "citations": [
        {
          "path": "src/state/work.mjs",
          "startLine": 445,
          "endLine": 467,
          "blobSha": "154507cc747a6e83f3abc215c83f560cb02f459a"
        },
        {
          "path": "src/workflow/runner.mjs",
          "startLine": 419,
          "endLine": 428,
          "blobSha": "82f25b3dc6a5d8121874ec75566fb439b751edc5"
        },
        {
          "path": "src/runner/execution/run.mjs",
          "startLine": 331,
          "endLine": 340,
          "blobSha": "3f3202edfb9bc983cc042b441d45d10e8e089f6e"
        },
        {
          "path": "src/runner/dispatch/plan.mjs",
          "startLine": 444,
          "endLine": 461,
          "blobSha": "07dea2a62267ec3554b2b1d459dca82eb04e5483"
        }
      ],
      "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. The specific current code/consumer boundary is checked in the cited section.",
      "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
    }
  },
  "allCitationComparisons": [
    {
      "path": "src/workflow/runner.mjs",
      "beforeBlob": "82f25b3dc6a5d8121874ec75566fb439b751edc5",
      "afterBlob": "cda214f0e07b136e8ab1bca43f149a3a12cdac9f",
      "beforeStartLine": 419,
      "beforeEndLine": 428,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "          try {\n            unitRunResult = await runUnit({\n              unitData,\n              repoRoot: mainRoot,\n              cwd: unitWorktree,\n              worktree: unitWorktree,\n              pattern: unitPatternOf(u.template),\n              overrides: unitOverridesOf(u),\n              workflow: { runId: workflowRunId, stepId: step.id, unitId: u.id },\n            });",
      "excerptDigest": "464bfcfeea7fc87f66d4867e9c9b44be401a2d6973a48cce279949ef41939cac"
    },
    {
      "path": "src/runner/execution/run.mjs",
      "beforeBlob": "3f3202edfb9bc983cc042b441d45d10e8e089f6e",
      "afterBlob": "47eb3fc3f389ef9f0c0f0136277da1e34c89bb8b",
      "beforeStartLine": 331,
      "beforeEndLine": 340,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "      objective,\n      mutation: readOnly ? 'read-only' : 'mutating',\n      binding: bound,\n      provenance: {\n        kind: 'unit-run',\n        unitRunId,\n        role,\n        round,\n        binding: bound,\n      },",
      "excerptDigest": "c342412e8bfcfd827b25c3acbe23e02b5720070b0159481a35487b4b931f3d6b"
    }
  ],
  "receiptArtifact": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-sync-repin.json",
  "receiptCommit": "6c6a65e8543fa72012bd55f8999f13f9ed6193c4",
  "meaning": "Cited code changed; receipt remains immutable history, current unit candidate-unverified; no truth re-verification."
}
````

### Complete source / predecessor

Path/anchor: docs/platform/agent-coordination/spec.md#agent-coordination-spec
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 212dcfd747c924d1e8ff5b65f47f0c146fec482bfe80818922875bea5c379e06
Shown text SHA256: 2e6ebf15563276468332ff447b1a4119804ea631c94315ae9d7144d605d5f9c9
Lines: 1 to 1

````text
# Agent Coordination Spec

```txt
Document type: Spec
Audience: Human reviewer, maintainer and implementation agent
Purpose: Route current execution to its code and runner-spec owners, retaining verified boundaries
Design status: Candidate
Implementation: Current execution is owned by CollaborationPattern and the Workflow runner
Provenance: Whole-area reframe under owner A16; complete classified input preserved in history/retired-engine/files
Writer type: Human + agent coauthor
Canonical for: Current-owner navigation and verified boundaries; not a second runtime specification
Use this when: Locating current execution owners or auditing historical claims
Do not use this for: Reinstating CoordinationSession, CoordinationProtocol or FlowDefinition as current implementation
Last reviewed: Pending independent whole-area review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
- docs/platform/agent-coordination/history/retired-engine/spec.md
Supersedes: Stale current-state framing only; all old claims are preserved verbatim
Superseded by: Runtime ownership in docs/specs/runner.md
Added in candidate: Retirement framing and current-owner navigation
```

The coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`. This page routes current execution to [the runner spec](../../specs/runner.md) and preserves verified boundaries; the [complete former spec](history/retired-engine/spec.md#literal-snapshot) is non-authority history.
````

### Complete target / successor

Path/anchor: docs/platform/agent-coordination/spec.md#agent-coordination-spec
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 212dcfd747c924d1e8ff5b65f47f0c146fec482bfe80818922875bea5c379e06
Shown text SHA256: 2e6ebf15563276468332ff447b1a4119804ea631c94315ae9d7144d605d5f9c9
Lines: 1 to 1

````text
# Agent Coordination Spec

```txt
Document type: Spec
Audience: Human reviewer, maintainer and implementation agent
Purpose: Route current execution to its code and runner-spec owners, retaining verified boundaries
Design status: Candidate
Implementation: Current execution is owned by CollaborationPattern and the Workflow runner
Provenance: Whole-area reframe under owner A16; complete classified input preserved in history/retired-engine/files
Writer type: Human + agent coauthor
Canonical for: Current-owner navigation and verified boundaries; not a second runtime specification
Use this when: Locating current execution owners or auditing historical claims
Do not use this for: Reinstating CoordinationSession, CoordinationProtocol or FlowDefinition as current implementation
Last reviewed: Pending independent whole-area review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
- docs/platform/agent-coordination/history/retired-engine/spec.md
Supersedes: Stale current-state framing only; all old claims are preserved verbatim
Superseded by: Runtime ownership in docs/specs/runner.md
Added in candidate: Retirement framing and current-owner navigation
```

The coordination engine was retired in `2180b4e72701bb090288af8fe8021008d9d42079`. This page routes current execution to [the runner spec](../../specs/runner.md) and preserves verified boundaries; the [complete former spec](history/retired-engine/spec.md#literal-snapshot) is non-authority history.
````

### Full diff

```diff

```

## receipt-claim_1b9e2ea95285bcf3db525a371492b405-s2-agent-coordination-truth-classifications

Entry kind: code-receipt-accounting
Class: Judgment
Source digest: 674ed15043cb82124d0e7350e71c4d554d34c9f298617c34ad31d6db06f1f909
Target digest: 674ed15043cb82124d0e7350e71c4d554d34c9f298617c34ad31d6db06f1f909

### Merge accounting

```json
{
  "mode": "candidate-unverified",
  "originalReviewedRef": {
    "claimId": "claim_1b9e2ea95285bcf3db525a371492b405",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "reviewed",
    "reviewNote": "spec.md#current-summary: Unit current-summary (lines 26-26) sits in section current-summary: Pattern selection and Workflow-to-Unit call confirmed: src/runner/execution/patterns/index.mjs:34-46 runPattern, src/workflow/runner.mjs:420 runUnit; all four owner files in lines 35-38 exist.",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
    "reviewedAt": "2026-10-10",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
    "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea"
  },
  "currentPendingRef": {
    "claimId": "claim_1b9e2ea95285bcf3db525a371492b405",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "pending",
    "pendingReason": "A31 cited code changed; old receipt stays immutable history, current native unit candidate-unverified under A28; full truth check owed at promotion."
  },
  "completeOldReceipt": {
    "claimId": "claim_1b9e2ea95285bcf3db525a371492b405",
    "path": "docs/platform/agent-coordination/spec.md",
    "anchor": "current-summary",
    "unitDigest": "674ed15043cb82124d0e7350e71c4d554d34c9f298617c34ad31d6db06f1f909",
    "shownText": "## Current Summary\n\nCurrent Unit collaboration is selected by CollaborationPattern; executable\nWorkflow nodes call the Unit execution core. This is a current-owner map,\nnot an assertion that CoordinationProtocol is a current prerequisite or entity.\nEvidence: src/runner/execution/patterns/index.mjs:34-46; src/workflow/runner.mjs:419-428.\n\nCurrent execution owners are:\n\n- CollaborationPattern for Unit runs: `src/runner/execution/patterns/index.mjs`.\n- The Workflow runner: `src/workflow/runner.mjs`.\n- Their current contract: [docs/specs/runner.md](../../specs/runner.md), not the retired CoordinationSession engine.\n- Assignment/Run dispatch: `src/runner/dispatch/assignment.mjs`, `plan.mjs`, `assignment-runner.mjs` and `run-result.mjs`; the current [dispatch contract](contracts/assignment-run-runresult.md) and [control-plane owner](architecture/dispatch-control-plane.md) retain that boundary.",
    "shownTextDigest": "7092fb0e053ac0ae5aad2f228b011708e661fa6cb4d8c06a539945899202d848",
    "class": "candidate-native-content",
    "authoredBy": "codex-session:1@2026-10-10",
    "rationale": "This current unit belongs to the truth-only section Agent Coordination Spec > Current Summary, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: verified. No prior verdict is carried to this receipt.",
    "truthSection": {
      "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
      "anchor": "current-summary",
      "status": "verified",
      "reason": null
    },
    "currentEvidence": {
      "commit": "af6c116f0e2af1f31f5e1d57830dc60de0c65411",
      "finding": "true-and-current",
      "citations": [
        {
          "path": "src/state/work.mjs",
          "startLine": 445,
          "endLine": 467,
          "blobSha": "154507cc747a6e83f3abc215c83f560cb02f459a"
        },
        {
          "path": "src/workflow/runner.mjs",
          "startLine": 419,
          "endLine": 428,
          "blobSha": "82f25b3dc6a5d8121874ec75566fb439b751edc5"
        },
        {
          "path": "src/runner/execution/run.mjs",
          "startLine": 331,
          "endLine": 340,
          "blobSha": "3f3202edfb9bc983cc042b441d45d10e8e089f6e"
        },
        {
          "path": "src/runner/dispatch/plan.mjs",
          "startLine": 444,
          "endLine": 461,
          "blobSha": "07dea2a62267ec3554b2b1d459dca82eb04e5483"
        }
      ],
      "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. The specific current code/consumer boundary is checked in the cited section.",
      "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
    }
  },
  "allCitationComparisons": [
    {
      "path": "src/workflow/runner.mjs",
      "beforeBlob": "82f25b3dc6a5d8121874ec75566fb439b751edc5",
      "afterBlob": "cda214f0e07b136e8ab1bca43f149a3a12cdac9f",
      "beforeStartLine": 419,
      "beforeEndLine": 428,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "          try {\n            unitRunResult = await runUnit({\n              unitData,\n              repoRoot: mainRoot,\n              cwd: unitWorktree,\n              worktree: unitWorktree,\n              pattern: unitPatternOf(u.template),\n              overrides: unitOverridesOf(u),\n              workflow: { runId: workflowRunId, stepId: step.id, unitId: u.id },\n            });",
      "excerptDigest": "464bfcfeea7fc87f66d4867e9c9b44be401a2d6973a48cce279949ef41939cac"
    },
    {
      "path": "src/runner/execution/run.mjs",
      "beforeBlob": "3f3202edfb9bc983cc042b441d45d10e8e089f6e",
      "afterBlob": "47eb3fc3f389ef9f0c0f0136277da1e34c89bb8b",
      "beforeStartLine": 331,
      "beforeEndLine": 340,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "      objective,\n      mutation: readOnly ? 'read-only' : 'mutating',\n      binding: bound,\n      provenance: {\n        kind: 'unit-run',\n        unitRunId,\n        role,\n        round,\n        binding: bound,\n      },",
      "excerptDigest": "c342412e8bfcfd827b25c3acbe23e02b5720070b0159481a35487b4b931f3d6b"
    }
  ],
  "receiptArtifact": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-sync-repin.json",
  "receiptCommit": "6c6a65e8543fa72012bd55f8999f13f9ed6193c4",
  "meaning": "Cited code changed; receipt remains immutable history, current unit candidate-unverified; no truth re-verification."
}
```

### Complete source / predecessor

Path/anchor: docs/platform/agent-coordination/spec.md#current-summary
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 674ed15043cb82124d0e7350e71c4d554d34c9f298617c34ad31d6db06f1f909
Shown text SHA256: 7092fb0e053ac0ae5aad2f228b011708e661fa6cb4d8c06a539945899202d848
Lines: 26 to 26

```text
## Current Summary

Current Unit collaboration is selected by CollaborationPattern; executable
Workflow nodes call the Unit execution core. This is a current-owner map,
not an assertion that CoordinationProtocol is a current prerequisite or entity.
Evidence: src/runner/execution/patterns/index.mjs:34-46; src/workflow/runner.mjs:419-428.

Current execution owners are:

- CollaborationPattern for Unit runs: `src/runner/execution/patterns/index.mjs`.
- The Workflow runner: `src/workflow/runner.mjs`.
- Their current contract: [docs/specs/runner.md](../../specs/runner.md), not the retired CoordinationSession engine.
- Assignment/Run dispatch: `src/runner/dispatch/assignment.mjs`, `plan.mjs`, `assignment-runner.mjs` and `run-result.mjs`; the current [dispatch contract](contracts/assignment-run-runresult.md) and [control-plane owner](architecture/dispatch-control-plane.md) retain that boundary.
```

### Complete target / successor

Path/anchor: docs/platform/agent-coordination/spec.md#current-summary
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 674ed15043cb82124d0e7350e71c4d554d34c9f298617c34ad31d6db06f1f909
Shown text SHA256: 7092fb0e053ac0ae5aad2f228b011708e661fa6cb4d8c06a539945899202d848
Lines: 26 to 26

```text
## Current Summary

Current Unit collaboration is selected by CollaborationPattern; executable
Workflow nodes call the Unit execution core. This is a current-owner map,
not an assertion that CoordinationProtocol is a current prerequisite or entity.
Evidence: src/runner/execution/patterns/index.mjs:34-46; src/workflow/runner.mjs:419-428.

Current execution owners are:

- CollaborationPattern for Unit runs: `src/runner/execution/patterns/index.mjs`.
- The Workflow runner: `src/workflow/runner.mjs`.
- Their current contract: [docs/specs/runner.md](../../specs/runner.md), not the retired CoordinationSession engine.
- Assignment/Run dispatch: `src/runner/dispatch/assignment.mjs`, `plan.mjs`, `assignment-runner.mjs` and `run-result.mjs`; the current [dispatch contract](contracts/assignment-run-runresult.md) and [control-plane owner](architecture/dispatch-control-plane.md) retain that boundary.
```

### Full diff

```diff

```

## receipt-claim_6c4f618a99c27c8d995e5ae4ea838c31-s2-agent-coordination-truth-classifications

Entry kind: code-receipt-accounting
Class: Judgment
Source digest: da24681315c1fe3d0a5c0da30afb76e5fb1d585a86a618d43aaba649ff5adf07
Target digest: da24681315c1fe3d0a5c0da30afb76e5fb1d585a86a618d43aaba649ff5adf07

### Merge accounting

```json
{
  "mode": "candidate-unverified",
  "originalReviewedRef": {
    "claimId": "claim_6c4f618a99c27c8d995e5ae4ea838c31",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "reviewed",
    "reviewNote": "spec.md#scope: Unit scope (lines 40-40) sits in section scope: Pointer-only section; links to runner spec and retired-engine snapshot resolve and anchor literal-snapshot passes.",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
    "reviewedAt": "2026-10-10",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
    "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea"
  },
  "currentPendingRef": {
    "claimId": "claim_6c4f618a99c27c8d995e5ae4ea838c31",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "pending",
    "pendingReason": "A31 cited code changed; old receipt stays immutable history, current native unit candidate-unverified under A28; full truth check owed at promotion."
  },
  "completeOldReceipt": {
    "claimId": "claim_6c4f618a99c27c8d995e5ae4ea838c31",
    "path": "docs/platform/agent-coordination/spec.md",
    "anchor": "scope",
    "unitDigest": "da24681315c1fe3d0a5c0da30afb76e5fb1d585a86a618d43aaba649ff5adf07",
    "shownText": "## Scope\n\nFor current execution ownership read [the runner spec](../../specs/runner.md). The complete former scope is preserved in the [retired-engine snapshot](history/retired-engine/spec.md#literal-snapshot); it is not an ownership claim for a current engine.",
    "shownTextDigest": "f0a0383c1d195e61dc5a2bfd82ec38b4cb09f730115b0b958b08e947b3d6a034",
    "class": "candidate-native-content",
    "authoredBy": "codex-session:1@2026-10-10",
    "rationale": "This current unit belongs to the truth-only section Agent Coordination Spec > Scope, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: verified. No prior verdict is carried to this receipt.",
    "truthSection": {
      "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
      "anchor": "scope",
      "status": "verified",
      "reason": null
    },
    "currentEvidence": {
      "commit": "af6c116f0e2af1f31f5e1d57830dc60de0c65411",
      "finding": "true-and-current",
      "citations": [
        {
          "path": "src/state/work.mjs",
          "startLine": 445,
          "endLine": 467,
          "blobSha": "154507cc747a6e83f3abc215c83f560cb02f459a"
        },
        {
          "path": "src/workflow/runner.mjs",
          "startLine": 419,
          "endLine": 428,
          "blobSha": "82f25b3dc6a5d8121874ec75566fb439b751edc5"
        },
        {
          "path": "src/runner/execution/run.mjs",
          "startLine": 331,
          "endLine": 340,
          "blobSha": "3f3202edfb9bc983cc042b441d45d10e8e089f6e"
        },
        {
          "path": "src/runner/dispatch/plan.mjs",
          "startLine": 444,
          "endLine": 461,
          "blobSha": "07dea2a62267ec3554b2b1d459dca82eb04e5483"
        }
      ],
      "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. The specific current code/consumer boundary is checked in the cited section.",
      "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
    }
  },
  "allCitationComparisons": [
    {
      "path": "src/workflow/runner.mjs",
      "beforeBlob": "82f25b3dc6a5d8121874ec75566fb439b751edc5",
      "afterBlob": "cda214f0e07b136e8ab1bca43f149a3a12cdac9f",
      "beforeStartLine": 419,
      "beforeEndLine": 428,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "          try {\n            unitRunResult = await runUnit({\n              unitData,\n              repoRoot: mainRoot,\n              cwd: unitWorktree,\n              worktree: unitWorktree,\n              pattern: unitPatternOf(u.template),\n              overrides: unitOverridesOf(u),\n              workflow: { runId: workflowRunId, stepId: step.id, unitId: u.id },\n            });",
      "excerptDigest": "464bfcfeea7fc87f66d4867e9c9b44be401a2d6973a48cce279949ef41939cac"
    },
    {
      "path": "src/runner/execution/run.mjs",
      "beforeBlob": "3f3202edfb9bc983cc042b441d45d10e8e089f6e",
      "afterBlob": "47eb3fc3f389ef9f0c0f0136277da1e34c89bb8b",
      "beforeStartLine": 331,
      "beforeEndLine": 340,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "      objective,\n      mutation: readOnly ? 'read-only' : 'mutating',\n      binding: bound,\n      provenance: {\n        kind: 'unit-run',\n        unitRunId,\n        role,\n        round,\n        binding: bound,\n      },",
      "excerptDigest": "c342412e8bfcfd827b25c3acbe23e02b5720070b0159481a35487b4b931f3d6b"
    }
  ],
  "receiptArtifact": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-sync-repin.json",
  "receiptCommit": "6c6a65e8543fa72012bd55f8999f13f9ed6193c4",
  "meaning": "Cited code changed; receipt remains immutable history, current unit candidate-unverified; no truth re-verification."
}
```

### Complete source / predecessor

Path/anchor: docs/platform/agent-coordination/spec.md#scope
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: da24681315c1fe3d0a5c0da30afb76e5fb1d585a86a618d43aaba649ff5adf07
Shown text SHA256: f0a0383c1d195e61dc5a2bfd82ec38b4cb09f730115b0b958b08e947b3d6a034
Lines: 40 to 40

```text
## Scope

For current execution ownership read [the runner spec](../../specs/runner.md). The complete former scope is preserved in the [retired-engine snapshot](history/retired-engine/spec.md#literal-snapshot); it is not an ownership claim for a current engine.
```

### Complete target / successor

Path/anchor: docs/platform/agent-coordination/spec.md#scope
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: da24681315c1fe3d0a5c0da30afb76e5fb1d585a86a618d43aaba649ff5adf07
Shown text SHA256: f0a0383c1d195e61dc5a2bfd82ec38b4cb09f730115b0b958b08e947b3d6a034
Lines: 40 to 40

```text
## Scope

For current execution ownership read [the runner spec](../../specs/runner.md). The complete former scope is preserved in the [retired-engine snapshot](history/retired-engine/spec.md#literal-snapshot); it is not an ownership claim for a current engine.
```

### Full diff

```diff

```

## receipt-claim_7c7e5b0cd65941649f09dccaccc3fcb8-s2-agent-coordination-truth-classifications

Entry kind: code-receipt-accounting
Class: Judgment
Source digest: 3f1ec225afa6433d22c0f73618c80e364ea4bb5549a9975efa550e145785cb88
Target digest: 3f1ec225afa6433d22c0f73618c80e364ea4bb5549a9975efa550e145785cb88

### Merge accounting

```json
{
  "mode": "candidate-unverified",
  "originalReviewedRef": {
    "claimId": "claim_7c7e5b0cd65941649f09dccaccc3fcb8",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "reviewed",
    "reviewNote": "spec.md#non-scope: Unit non-scope (lines 44-44) sits in section non-scope: Exclusions hold: provider account inventory is global-only (provider-capacity.mjs:62), host routing and packaging owners exist at the linked READMEs.",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
    "reviewedAt": "2026-10-10",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
    "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea"
  },
  "currentPendingRef": {
    "claimId": "claim_7c7e5b0cd65941649f09dccaccc3fcb8",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "pending",
    "pendingReason": "A31 cited code changed; old receipt stays immutable history, current native unit candidate-unverified under A28; full truth check owed at promotion."
  },
  "completeOldReceipt": {
    "claimId": "claim_7c7e5b0cd65941649f09dccaccc3fcb8",
    "path": "docs/platform/agent-coordination/spec.md",
    "anchor": "non-scope",
    "unitDigest": "3f1ec225afa6433d22c0f73618c80e364ea4bb5549a9975efa550e145785cb88",
    "shownText": "## Non-Scope\n\nThis area does not own:\n\n- Work lifecycle authority, state transitions, merge, or branch lifecycle;\n- host command/provider process routing, owned by\n  [host-invocation-routing](../host-invocation-routing/README.md);\n- installation, activation, release manifest, setup/doctor, or runtime identity,\n  owned by [packaging-distribution](../packaging-distribution/README.md);\n- project-local account inventory for provider capacity;\n- proposal approval by path rename alone.",
    "shownTextDigest": "9be84ecb8995f8af04a3e80086d7d38246bd0ca8c5003d923d7a219cce32cfe7",
    "class": "candidate-native-content",
    "authoredBy": "codex-session:1@2026-10-10",
    "rationale": "This current unit belongs to the truth-only section Agent Coordination Spec > Non-Scope, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: verified. No prior verdict is carried to this receipt.",
    "truthSection": {
      "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
      "anchor": "non-scope",
      "status": "verified",
      "reason": null
    },
    "currentEvidence": {
      "commit": "af6c116f0e2af1f31f5e1d57830dc60de0c65411",
      "finding": "true-and-current",
      "citations": [
        {
          "path": "src/state/work.mjs",
          "startLine": 445,
          "endLine": 467,
          "blobSha": "154507cc747a6e83f3abc215c83f560cb02f459a"
        },
        {
          "path": "src/workflow/runner.mjs",
          "startLine": 419,
          "endLine": 428,
          "blobSha": "82f25b3dc6a5d8121874ec75566fb439b751edc5"
        },
        {
          "path": "src/runner/execution/run.mjs",
          "startLine": 331,
          "endLine": 340,
          "blobSha": "3f3202edfb9bc983cc042b441d45d10e8e089f6e"
        },
        {
          "path": "src/runner/dispatch/plan.mjs",
          "startLine": 444,
          "endLine": 461,
          "blobSha": "07dea2a62267ec3554b2b1d459dca82eb04e5483"
        }
      ],
      "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. The specific current code/consumer boundary is checked in the cited section.",
      "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
    }
  },
  "allCitationComparisons": [
    {
      "path": "src/workflow/runner.mjs",
      "beforeBlob": "82f25b3dc6a5d8121874ec75566fb439b751edc5",
      "afterBlob": "cda214f0e07b136e8ab1bca43f149a3a12cdac9f",
      "beforeStartLine": 419,
      "beforeEndLine": 428,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "          try {\n            unitRunResult = await runUnit({\n              unitData,\n              repoRoot: mainRoot,\n              cwd: unitWorktree,\n              worktree: unitWorktree,\n              pattern: unitPatternOf(u.template),\n              overrides: unitOverridesOf(u),\n              workflow: { runId: workflowRunId, stepId: step.id, unitId: u.id },\n            });",
      "excerptDigest": "464bfcfeea7fc87f66d4867e9c9b44be401a2d6973a48cce279949ef41939cac"
    },
    {
      "path": "src/runner/execution/run.mjs",
      "beforeBlob": "3f3202edfb9bc983cc042b441d45d10e8e089f6e",
      "afterBlob": "47eb3fc3f389ef9f0c0f0136277da1e34c89bb8b",
      "beforeStartLine": 331,
      "beforeEndLine": 340,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "      objective,\n      mutation: readOnly ? 'read-only' : 'mutating',\n      binding: bound,\n      provenance: {\n        kind: 'unit-run',\n        unitRunId,\n        role,\n        round,\n        binding: bound,\n      },",
      "excerptDigest": "c342412e8bfcfd827b25c3acbe23e02b5720070b0159481a35487b4b931f3d6b"
    }
  ],
  "receiptArtifact": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-sync-repin.json",
  "receiptCommit": "6c6a65e8543fa72012bd55f8999f13f9ed6193c4",
  "meaning": "Cited code changed; receipt remains immutable history, current unit candidate-unverified; no truth re-verification."
}
```

### Complete source / predecessor

Path/anchor: docs/platform/agent-coordination/spec.md#non-scope
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 3f1ec225afa6433d22c0f73618c80e364ea4bb5549a9975efa550e145785cb88
Shown text SHA256: 9be84ecb8995f8af04a3e80086d7d38246bd0ca8c5003d923d7a219cce32cfe7
Lines: 44 to 44

```text
## Non-Scope

This area does not own:

- Work lifecycle authority, state transitions, merge, or branch lifecycle;
- host command/provider process routing, owned by
  [host-invocation-routing](../host-invocation-routing/README.md);
- installation, activation, release manifest, setup/doctor, or runtime identity,
  owned by [packaging-distribution](../packaging-distribution/README.md);
- project-local account inventory for provider capacity;
- proposal approval by path rename alone.
```

### Complete target / successor

Path/anchor: docs/platform/agent-coordination/spec.md#non-scope
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 3f1ec225afa6433d22c0f73618c80e364ea4bb5549a9975efa550e145785cb88
Shown text SHA256: 9be84ecb8995f8af04a3e80086d7d38246bd0ca8c5003d923d7a219cce32cfe7
Lines: 44 to 44

```text
## Non-Scope

This area does not own:

- Work lifecycle authority, state transitions, merge, or branch lifecycle;
- host command/provider process routing, owned by
  [host-invocation-routing](../host-invocation-routing/README.md);
- installation, activation, release manifest, setup/doctor, or runtime identity,
  owned by [packaging-distribution](../packaging-distribution/README.md);
- project-local account inventory for provider capacity;
- proposal approval by path rename alone.
```

### Full diff

```diff

```

## receipt-claim_74b00b519bc6b0b62131eef05e5e7061-s2-agent-coordination-truth-classifications

Entry kind: code-receipt-accounting
Class: Judgment
Source digest: 4c8e935895facbb1f259c6edb468f9dd1db54862a636775f8d239e1176361a96
Target digest: 4c8e935895facbb1f259c6edb468f9dd1db54862a636775f8d239e1176361a96

### Merge accounting

```json
{
  "mode": "candidate-unverified",
  "originalReviewedRef": {
    "claimId": "claim_74b00b519bc6b0b62131eef05e5e7061",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "reviewed",
    "reviewNote": "spec.md#unheaded-block-7: Unit unheaded-block-7 (lines 46-54) sits in section non-scope: Exclusions hold: provider account inventory is global-only (provider-capacity.mjs:62), host routing and packaging owners exist at the linked READMEs.",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
    "reviewedAt": "2026-10-10",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
    "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea"
  },
  "currentPendingRef": {
    "claimId": "claim_74b00b519bc6b0b62131eef05e5e7061",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "pending",
    "pendingReason": "A31 cited code changed; old receipt stays immutable history, current native unit candidate-unverified under A28; full truth check owed at promotion."
  },
  "completeOldReceipt": {
    "claimId": "claim_74b00b519bc6b0b62131eef05e5e7061",
    "path": "docs/platform/agent-coordination/spec.md",
    "anchor": "unheaded-block-7",
    "unitDigest": "4c8e935895facbb1f259c6edb468f9dd1db54862a636775f8d239e1176361a96",
    "shownText": "This area does not own:\n\n- Work lifecycle authority, state transitions, merge, or branch lifecycle;\n- host command/provider process routing, owned by\n  [host-invocation-routing](../host-invocation-routing/README.md);\n- installation, activation, release manifest, setup/doctor, or runtime identity,\n  owned by [packaging-distribution](../packaging-distribution/README.md);\n- project-local account inventory for provider capacity;\n- proposal approval by path rename alone.",
    "shownTextDigest": "4c8e935895facbb1f259c6edb468f9dd1db54862a636775f8d239e1176361a96",
    "class": "candidate-native-content",
    "authoredBy": "codex-session:1@2026-10-10",
    "rationale": "This current unit belongs to the truth-only section Agent Coordination Spec > Non-Scope, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: verified. No prior verdict is carried to this receipt.",
    "truthSection": {
      "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
      "anchor": "non-scope",
      "status": "verified",
      "reason": null
    },
    "currentEvidence": {
      "commit": "af6c116f0e2af1f31f5e1d57830dc60de0c65411",
      "finding": "true-and-current",
      "citations": [
        {
          "path": "src/state/work.mjs",
          "startLine": 445,
          "endLine": 467,
          "blobSha": "154507cc747a6e83f3abc215c83f560cb02f459a"
        },
        {
          "path": "src/workflow/runner.mjs",
          "startLine": 419,
          "endLine": 428,
          "blobSha": "82f25b3dc6a5d8121874ec75566fb439b751edc5"
        },
        {
          "path": "src/runner/execution/run.mjs",
          "startLine": 331,
          "endLine": 340,
          "blobSha": "3f3202edfb9bc983cc042b441d45d10e8e089f6e"
        },
        {
          "path": "src/runner/dispatch/plan.mjs",
          "startLine": 444,
          "endLine": 461,
          "blobSha": "07dea2a62267ec3554b2b1d459dca82eb04e5483"
        }
      ],
      "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. The specific current code/consumer boundary is checked in the cited section.",
      "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
    }
  },
  "allCitationComparisons": [
    {
      "path": "src/workflow/runner.mjs",
      "beforeBlob": "82f25b3dc6a5d8121874ec75566fb439b751edc5",
      "afterBlob": "cda214f0e07b136e8ab1bca43f149a3a12cdac9f",
      "beforeStartLine": 419,
      "beforeEndLine": 428,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "          try {\n            unitRunResult = await runUnit({\n              unitData,\n              repoRoot: mainRoot,\n              cwd: unitWorktree,\n              worktree: unitWorktree,\n              pattern: unitPatternOf(u.template),\n              overrides: unitOverridesOf(u),\n              workflow: { runId: workflowRunId, stepId: step.id, unitId: u.id },\n            });",
      "excerptDigest": "464bfcfeea7fc87f66d4867e9c9b44be401a2d6973a48cce279949ef41939cac"
    },
    {
      "path": "src/runner/execution/run.mjs",
      "beforeBlob": "3f3202edfb9bc983cc042b441d45d10e8e089f6e",
      "afterBlob": "47eb3fc3f389ef9f0c0f0136277da1e34c89bb8b",
      "beforeStartLine": 331,
      "beforeEndLine": 340,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "      objective,\n      mutation: readOnly ? 'read-only' : 'mutating',\n      binding: bound,\n      provenance: {\n        kind: 'unit-run',\n        unitRunId,\n        role,\n        round,\n        binding: bound,\n      },",
      "excerptDigest": "c342412e8bfcfd827b25c3acbe23e02b5720070b0159481a35487b4b931f3d6b"
    }
  ],
  "receiptArtifact": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-sync-repin.json",
  "receiptCommit": "6c6a65e8543fa72012bd55f8999f13f9ed6193c4",
  "meaning": "Cited code changed; receipt remains immutable history, current unit candidate-unverified; no truth re-verification."
}
```

### Complete source / predecessor

Path/anchor: docs/platform/agent-coordination/spec.md#unheaded-block-7
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 4c8e935895facbb1f259c6edb468f9dd1db54862a636775f8d239e1176361a96
Shown text SHA256: 4c8e935895facbb1f259c6edb468f9dd1db54862a636775f8d239e1176361a96
Lines: 46 to 54

```text
This area does not own:

- Work lifecycle authority, state transitions, merge, or branch lifecycle;
- host command/provider process routing, owned by
  [host-invocation-routing](../host-invocation-routing/README.md);
- installation, activation, release manifest, setup/doctor, or runtime identity,
  owned by [packaging-distribution](../packaging-distribution/README.md);
- project-local account inventory for provider capacity;
- proposal approval by path rename alone.
```

### Complete target / successor

Path/anchor: docs/platform/agent-coordination/spec.md#unheaded-block-7
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 4c8e935895facbb1f259c6edb468f9dd1db54862a636775f8d239e1176361a96
Shown text SHA256: 4c8e935895facbb1f259c6edb468f9dd1db54862a636775f8d239e1176361a96
Lines: 46 to 54

```text
This area does not own:

- Work lifecycle authority, state transitions, merge, or branch lifecycle;
- host command/provider process routing, owned by
  [host-invocation-routing](../host-invocation-routing/README.md);
- installation, activation, release manifest, setup/doctor, or runtime identity,
  owned by [packaging-distribution](../packaging-distribution/README.md);
- project-local account inventory for provider capacity;
- proposal approval by path rename alone.
```

### Full diff

```diff

```

## receipt-claim_bc2a036bfb370b61dfc459ae5a77cd8c-s2-agent-coordination-truth-classifications

Entry kind: code-receipt-accounting
Class: Judgment
Source digest: acdcf97689ac3ef4f115abb259848197cdc68f5c8864e53bfacd582dddbe94a8
Target digest: acdcf97689ac3ef4f115abb259848197cdc68f5c8864e53bfacd582dddbe94a8

### Merge accounting

```json
{
  "mode": "candidate-unverified",
  "originalReviewedRef": {
    "claimId": "claim_bc2a036bfb370b61dfc459ae5a77cd8c",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "reviewed",
    "reviewNote": "spec.md#actors-and-surfaces: Unit actors-and-surfaces (lines 56-56) sits in section actors-and-surfaces: Owner table rows exist (run.mjs, patterns/index.mjs, workflow/runner.mjs, assignment.mjs, plan.mjs, assignment-runner.mjs, run-result.mjs); `fgos coordination` is an unknown verb so the retired CLI row is accurate.",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
    "reviewedAt": "2026-10-10",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
    "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea"
  },
  "currentPendingRef": {
    "claimId": "claim_bc2a036bfb370b61dfc459ae5a77cd8c",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "pending",
    "pendingReason": "A31 cited code changed; old receipt stays immutable history, current native unit candidate-unverified under A28; full truth check owed at promotion."
  },
  "completeOldReceipt": {
    "claimId": "claim_bc2a036bfb370b61dfc459ae5a77cd8c",
    "path": "docs/platform/agent-coordination/spec.md",
    "anchor": "actors-and-surfaces",
    "unitDigest": "acdcf97689ac3ef4f115abb259848197cdc68f5c8864e53bfacd582dddbe94a8",
    "shownText": "## Actors And Surfaces\n\n| Surface | Current owner |\n|---|---|\n| Unit execution | `src/runner/execution/run.mjs` and `src/runner/execution/patterns/index.mjs` |\n| Workflow execution | `src/workflow/runner.mjs` |\n| Assignment/Run dispatch and normalization | `src/runner/dispatch/assignment.mjs`, `plan.mjs`, `assignment-runner.mjs`, `run-result.mjs` |\n| Retired coordination CLI | [Historical snapshot](history/retired-engine/spec.md#literal-snapshot), not a current public door |",
    "shownTextDigest": "05055feca35b925d2bdba85da2b5368cc0dca91d61bfcbdbf41663ea707657c2",
    "class": "candidate-native-content",
    "authoredBy": "codex-session:1@2026-10-10",
    "rationale": "This current unit belongs to the truth-only section Agent Coordination Spec > Actors And Surfaces, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: verified. No prior verdict is carried to this receipt.",
    "truthSection": {
      "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
      "anchor": "actors-and-surfaces",
      "status": "verified",
      "reason": null
    },
    "currentEvidence": {
      "commit": "af6c116f0e2af1f31f5e1d57830dc60de0c65411",
      "finding": "true-and-current",
      "citations": [
        {
          "path": "src/state/work.mjs",
          "startLine": 445,
          "endLine": 467,
          "blobSha": "154507cc747a6e83f3abc215c83f560cb02f459a"
        },
        {
          "path": "src/workflow/runner.mjs",
          "startLine": 419,
          "endLine": 428,
          "blobSha": "82f25b3dc6a5d8121874ec75566fb439b751edc5"
        },
        {
          "path": "src/runner/execution/run.mjs",
          "startLine": 331,
          "endLine": 340,
          "blobSha": "3f3202edfb9bc983cc042b441d45d10e8e089f6e"
        },
        {
          "path": "src/runner/dispatch/plan.mjs",
          "startLine": 444,
          "endLine": 461,
          "blobSha": "07dea2a62267ec3554b2b1d459dca82eb04e5483"
        }
      ],
      "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. The specific current code/consumer boundary is checked in the cited section.",
      "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
    }
  },
  "allCitationComparisons": [
    {
      "path": "src/workflow/runner.mjs",
      "beforeBlob": "82f25b3dc6a5d8121874ec75566fb439b751edc5",
      "afterBlob": "cda214f0e07b136e8ab1bca43f149a3a12cdac9f",
      "beforeStartLine": 419,
      "beforeEndLine": 428,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "          try {\n            unitRunResult = await runUnit({\n              unitData,\n              repoRoot: mainRoot,\n              cwd: unitWorktree,\n              worktree: unitWorktree,\n              pattern: unitPatternOf(u.template),\n              overrides: unitOverridesOf(u),\n              workflow: { runId: workflowRunId, stepId: step.id, unitId: u.id },\n            });",
      "excerptDigest": "464bfcfeea7fc87f66d4867e9c9b44be401a2d6973a48cce279949ef41939cac"
    },
    {
      "path": "src/runner/execution/run.mjs",
      "beforeBlob": "3f3202edfb9bc983cc042b441d45d10e8e089f6e",
      "afterBlob": "47eb3fc3f389ef9f0c0f0136277da1e34c89bb8b",
      "beforeStartLine": 331,
      "beforeEndLine": 340,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "      objective,\n      mutation: readOnly ? 'read-only' : 'mutating',\n      binding: bound,\n      provenance: {\n        kind: 'unit-run',\n        unitRunId,\n        role,\n        round,\n        binding: bound,\n      },",
      "excerptDigest": "c342412e8bfcfd827b25c3acbe23e02b5720070b0159481a35487b4b931f3d6b"
    }
  ],
  "receiptArtifact": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-sync-repin.json",
  "receiptCommit": "6c6a65e8543fa72012bd55f8999f13f9ed6193c4",
  "meaning": "Cited code changed; receipt remains immutable history, current unit candidate-unverified; no truth re-verification."
}
```

### Complete source / predecessor

Path/anchor: docs/platform/agent-coordination/spec.md#actors-and-surfaces
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: acdcf97689ac3ef4f115abb259848197cdc68f5c8864e53bfacd582dddbe94a8
Shown text SHA256: 05055feca35b925d2bdba85da2b5368cc0dca91d61bfcbdbf41663ea707657c2
Lines: 56 to 56

```text
## Actors And Surfaces

| Surface | Current owner |
|---|---|
| Unit execution | `src/runner/execution/run.mjs` and `src/runner/execution/patterns/index.mjs` |
| Workflow execution | `src/workflow/runner.mjs` |
| Assignment/Run dispatch and normalization | `src/runner/dispatch/assignment.mjs`, `plan.mjs`, `assignment-runner.mjs`, `run-result.mjs` |
| Retired coordination CLI | [Historical snapshot](history/retired-engine/spec.md#literal-snapshot), not a current public door |
```

### Complete target / successor

Path/anchor: docs/platform/agent-coordination/spec.md#actors-and-surfaces
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: acdcf97689ac3ef4f115abb259848197cdc68f5c8864e53bfacd582dddbe94a8
Shown text SHA256: 05055feca35b925d2bdba85da2b5368cc0dca91d61bfcbdbf41663ea707657c2
Lines: 56 to 56

```text
## Actors And Surfaces

| Surface | Current owner |
|---|---|
| Unit execution | `src/runner/execution/run.mjs` and `src/runner/execution/patterns/index.mjs` |
| Workflow execution | `src/workflow/runner.mjs` |
| Assignment/Run dispatch and normalization | `src/runner/dispatch/assignment.mjs`, `plan.mjs`, `assignment-runner.mjs`, `run-result.mjs` |
| Retired coordination CLI | [Historical snapshot](history/retired-engine/spec.md#literal-snapshot), not a current public door |
```

### Full diff

```diff

```

## receipt-claim_e55374f22025f86c63d8706a582e280d-s2-agent-coordination-truth-classifications

Entry kind: code-receipt-accounting
Class: Judgment
Source digest: 8bb3c31a5c50e4feb6c2a4a8409451bf235528d2e987f931282b28e15875d50a
Target digest: 8bb3c31a5c50e4feb6c2a4a8409451bf235528d2e987f931282b28e15875d50a

### Merge accounting

```json
{
  "mode": "candidate-unverified",
  "originalReviewedRef": {
    "claimId": "claim_e55374f22025f86c63d8706a582e280d",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "reviewed",
    "reviewNote": "spec.md#core-entities: Unit core-entities (lines 65-65) sits in section core-entities: Unit (src/runner/execution/unit.mjs) and CollaborationPattern files exist; DispatchPlan is compiled in plan.mjs (return object at 444-461); the not-exclusive-list caveat is accurate.",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
    "reviewedAt": "2026-10-10",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
    "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea"
  },
  "currentPendingRef": {
    "claimId": "claim_e55374f22025f86c63d8706a582e280d",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "pending",
    "pendingReason": "A31 cited code changed; old receipt stays immutable history, current native unit candidate-unverified under A28; full truth check owed at promotion."
  },
  "completeOldReceipt": {
    "claimId": "claim_e55374f22025f86c63d8706a582e280d",
    "path": "docs/platform/agent-coordination/spec.md",
    "anchor": "core-entities",
    "unitDigest": "8bb3c31a5c50e4feb6c2a4a8409451bf235528d2e987f931282b28e15875d50a",
    "shownText": "## Core Entities\n\nCurrent entities include [Unit](../../../src/runner/execution/unit.mjs), [CollaborationPattern](../../../src/runner/execution/patterns/index.mjs), Workflow definitions/runs, Assignment, Run, RunResult and the compiled DispatchPlan. Unit/Workflow execution uses the pattern/Workflow runners; Assignment construction, plan compilation, attempt admission and result normalization retain their dispatch-module owners listed above. This is not an exclusive three-entity list. CoordinationSession and FlowDefinition remain verbatim [history](history/retired-engine/spec.md#literal-snapshot), not current runtime prerequisites.",
    "shownTextDigest": "34a3e85759248848ff7ee52a7d01ede046a23c3a985df4139361e119ebc523c7",
    "class": "candidate-native-content",
    "authoredBy": "codex-session:1@2026-10-10",
    "rationale": "This current unit belongs to the truth-only section Agent Coordination Spec > Core Entities, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: verified. No prior verdict is carried to this receipt.",
    "truthSection": {
      "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
      "anchor": "core-entities",
      "status": "verified",
      "reason": null
    },
    "currentEvidence": {
      "commit": "af6c116f0e2af1f31f5e1d57830dc60de0c65411",
      "finding": "true-and-current",
      "citations": [
        {
          "path": "src/state/work.mjs",
          "startLine": 445,
          "endLine": 467,
          "blobSha": "154507cc747a6e83f3abc215c83f560cb02f459a"
        },
        {
          "path": "src/workflow/runner.mjs",
          "startLine": 419,
          "endLine": 428,
          "blobSha": "82f25b3dc6a5d8121874ec75566fb439b751edc5"
        },
        {
          "path": "src/runner/execution/run.mjs",
          "startLine": 331,
          "endLine": 340,
          "blobSha": "3f3202edfb9bc983cc042b441d45d10e8e089f6e"
        },
        {
          "path": "src/runner/dispatch/plan.mjs",
          "startLine": 444,
          "endLine": 461,
          "blobSha": "07dea2a62267ec3554b2b1d459dca82eb04e5483"
        }
      ],
      "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. The specific current code/consumer boundary is checked in the cited section.",
      "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
    }
  },
  "allCitationComparisons": [
    {
      "path": "src/workflow/runner.mjs",
      "beforeBlob": "82f25b3dc6a5d8121874ec75566fb439b751edc5",
      "afterBlob": "cda214f0e07b136e8ab1bca43f149a3a12cdac9f",
      "beforeStartLine": 419,
      "beforeEndLine": 428,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "          try {\n            unitRunResult = await runUnit({\n              unitData,\n              repoRoot: mainRoot,\n              cwd: unitWorktree,\n              worktree: unitWorktree,\n              pattern: unitPatternOf(u.template),\n              overrides: unitOverridesOf(u),\n              workflow: { runId: workflowRunId, stepId: step.id, unitId: u.id },\n            });",
      "excerptDigest": "464bfcfeea7fc87f66d4867e9c9b44be401a2d6973a48cce279949ef41939cac"
    },
    {
      "path": "src/runner/execution/run.mjs",
      "beforeBlob": "3f3202edfb9bc983cc042b441d45d10e8e089f6e",
      "afterBlob": "47eb3fc3f389ef9f0c0f0136277da1e34c89bb8b",
      "beforeStartLine": 331,
      "beforeEndLine": 340,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "      objective,\n      mutation: readOnly ? 'read-only' : 'mutating',\n      binding: bound,\n      provenance: {\n        kind: 'unit-run',\n        unitRunId,\n        role,\n        round,\n        binding: bound,\n      },",
      "excerptDigest": "c342412e8bfcfd827b25c3acbe23e02b5720070b0159481a35487b4b931f3d6b"
    }
  ],
  "receiptArtifact": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-sync-repin.json",
  "receiptCommit": "6c6a65e8543fa72012bd55f8999f13f9ed6193c4",
  "meaning": "Cited code changed; receipt remains immutable history, current unit candidate-unverified; no truth re-verification."
}
```

### Complete source / predecessor

Path/anchor: docs/platform/agent-coordination/spec.md#core-entities
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 8bb3c31a5c50e4feb6c2a4a8409451bf235528d2e987f931282b28e15875d50a
Shown text SHA256: 34a3e85759248848ff7ee52a7d01ede046a23c3a985df4139361e119ebc523c7
Lines: 65 to 65

```text
## Core Entities

Current entities include [Unit](../../../src/runner/execution/unit.mjs), [CollaborationPattern](../../../src/runner/execution/patterns/index.mjs), Workflow definitions/runs, Assignment, Run, RunResult and the compiled DispatchPlan. Unit/Workflow execution uses the pattern/Workflow runners; Assignment construction, plan compilation, attempt admission and result normalization retain their dispatch-module owners listed above. This is not an exclusive three-entity list. CoordinationSession and FlowDefinition remain verbatim [history](history/retired-engine/spec.md#literal-snapshot), not current runtime prerequisites.
```

### Complete target / successor

Path/anchor: docs/platform/agent-coordination/spec.md#core-entities
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 8bb3c31a5c50e4feb6c2a4a8409451bf235528d2e987f931282b28e15875d50a
Shown text SHA256: 34a3e85759248848ff7ee52a7d01ede046a23c3a985df4139361e119ebc523c7
Lines: 65 to 65

```text
## Core Entities

Current entities include [Unit](../../../src/runner/execution/unit.mjs), [CollaborationPattern](../../../src/runner/execution/patterns/index.mjs), Workflow definitions/runs, Assignment, Run, RunResult and the compiled DispatchPlan. Unit/Workflow execution uses the pattern/Workflow runners; Assignment construction, plan compilation, attempt admission and result normalization retain their dispatch-module owners listed above. This is not an exclusive three-entity list. CoordinationSession and FlowDefinition remain verbatim [history](history/retired-engine/spec.md#literal-snapshot), not current runtime prerequisites.
```

### Full diff

```diff

```

## receipt-claim_1c3292ad19c922c586854d5d126e6f3b-s2-agent-coordination-truth-classifications

Entry kind: code-receipt-accounting
Class: Judgment
Source digest: b5d23e6526b5c4fc3a8c395b8a9cf7956e49e7a846fcb942c2938de82dc06e82
Target digest: b5d23e6526b5c4fc3a8c395b8a9cf7956e49e7a846fcb942c2938de82dc06e82

### Merge accounting

```json
{
  "mode": "candidate-unverified",
  "originalReviewedRef": {
    "claimId": "claim_1c3292ad19c922c586854d5d126e6f3b",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "reviewed",
    "reviewNote": "spec.md#operations-and-flows: Unit operations-and-flows (lines 69-69) sits in section operations-and-flows: Points to the Workflow runner and patterns as current sequencing owners; former flow table is correctly labelled history.",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
    "reviewedAt": "2026-10-10",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
    "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea"
  },
  "currentPendingRef": {
    "claimId": "claim_1c3292ad19c922c586854d5d126e6f3b",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "pending",
    "pendingReason": "A31 cited code changed; old receipt stays immutable history, current native unit candidate-unverified under A28; full truth check owed at promotion."
  },
  "completeOldReceipt": {
    "claimId": "claim_1c3292ad19c922c586854d5d126e6f3b",
    "path": "docs/platform/agent-coordination/spec.md",
    "anchor": "operations-and-flows",
    "unitDigest": "b5d23e6526b5c4fc3a8c395b8a9cf7956e49e7a846fcb942c2938de82dc06e82",
    "shownText": "## Operations And Flows\n\nCurrent sequencing and collaboration belong to the [Workflow runner](../../../src/workflow/runner.mjs) and [CollaborationPattern](../../../src/runner/execution/patterns/index.mjs). The former engine flow/status table is [preserved history](history/retired-engine/spec.md#literal-snapshot), not evidence that those flows are shipped.",
    "shownTextDigest": "ba8a4301b6e27639859488d84cff7ee905b4a2dc8c2af9277699a74c6e0f3958",
    "class": "candidate-native-content",
    "authoredBy": "codex-session:1@2026-10-10",
    "rationale": "This current unit belongs to the truth-only section Agent Coordination Spec > Operations And Flows, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: verified. No prior verdict is carried to this receipt.",
    "truthSection": {
      "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
      "anchor": "operations-and-flows",
      "status": "verified",
      "reason": null
    },
    "currentEvidence": {
      "commit": "af6c116f0e2af1f31f5e1d57830dc60de0c65411",
      "finding": "true-and-current",
      "citations": [
        {
          "path": "src/state/work.mjs",
          "startLine": 445,
          "endLine": 467,
          "blobSha": "154507cc747a6e83f3abc215c83f560cb02f459a"
        },
        {
          "path": "src/workflow/runner.mjs",
          "startLine": 419,
          "endLine": 428,
          "blobSha": "82f25b3dc6a5d8121874ec75566fb439b751edc5"
        },
        {
          "path": "src/runner/execution/run.mjs",
          "startLine": 331,
          "endLine": 340,
          "blobSha": "3f3202edfb9bc983cc042b441d45d10e8e089f6e"
        },
        {
          "path": "src/runner/dispatch/plan.mjs",
          "startLine": 444,
          "endLine": 461,
          "blobSha": "07dea2a62267ec3554b2b1d459dca82eb04e5483"
        }
      ],
      "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. The specific current code/consumer boundary is checked in the cited section.",
      "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
    }
  },
  "allCitationComparisons": [
    {
      "path": "src/workflow/runner.mjs",
      "beforeBlob": "82f25b3dc6a5d8121874ec75566fb439b751edc5",
      "afterBlob": "cda214f0e07b136e8ab1bca43f149a3a12cdac9f",
      "beforeStartLine": 419,
      "beforeEndLine": 428,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "          try {\n            unitRunResult = await runUnit({\n              unitData,\n              repoRoot: mainRoot,\n              cwd: unitWorktree,\n              worktree: unitWorktree,\n              pattern: unitPatternOf(u.template),\n              overrides: unitOverridesOf(u),\n              workflow: { runId: workflowRunId, stepId: step.id, unitId: u.id },\n            });",
      "excerptDigest": "464bfcfeea7fc87f66d4867e9c9b44be401a2d6973a48cce279949ef41939cac"
    },
    {
      "path": "src/runner/execution/run.mjs",
      "beforeBlob": "3f3202edfb9bc983cc042b441d45d10e8e089f6e",
      "afterBlob": "47eb3fc3f389ef9f0c0f0136277da1e34c89bb8b",
      "beforeStartLine": 331,
      "beforeEndLine": 340,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "      objective,\n      mutation: readOnly ? 'read-only' : 'mutating',\n      binding: bound,\n      provenance: {\n        kind: 'unit-run',\n        unitRunId,\n        role,\n        round,\n        binding: bound,\n      },",
      "excerptDigest": "c342412e8bfcfd827b25c3acbe23e02b5720070b0159481a35487b4b931f3d6b"
    }
  ],
  "receiptArtifact": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-sync-repin.json",
  "receiptCommit": "6c6a65e8543fa72012bd55f8999f13f9ed6193c4",
  "meaning": "Cited code changed; receipt remains immutable history, current unit candidate-unverified; no truth re-verification."
}
```

### Complete source / predecessor

Path/anchor: docs/platform/agent-coordination/spec.md#operations-and-flows
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: b5d23e6526b5c4fc3a8c395b8a9cf7956e49e7a846fcb942c2938de82dc06e82
Shown text SHA256: ba8a4301b6e27639859488d84cff7ee905b4a2dc8c2af9277699a74c6e0f3958
Lines: 69 to 69

```text
## Operations And Flows

Current sequencing and collaboration belong to the [Workflow runner](../../../src/workflow/runner.mjs) and [CollaborationPattern](../../../src/runner/execution/patterns/index.mjs). The former engine flow/status table is [preserved history](history/retired-engine/spec.md#literal-snapshot), not evidence that those flows are shipped.
```

### Complete target / successor

Path/anchor: docs/platform/agent-coordination/spec.md#operations-and-flows
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: b5d23e6526b5c4fc3a8c395b8a9cf7956e49e7a846fcb942c2938de82dc06e82
Shown text SHA256: ba8a4301b6e27639859488d84cff7ee905b4a2dc8c2af9277699a74c6e0f3958
Lines: 69 to 69

```text
## Operations And Flows

Current sequencing and collaboration belong to the [Workflow runner](../../../src/workflow/runner.mjs) and [CollaborationPattern](../../../src/runner/execution/patterns/index.mjs). The former engine flow/status table is [preserved history](history/retired-engine/spec.md#literal-snapshot), not evidence that those flows are shipped.
```

### Full diff

```diff

```

## receipt-claim_bdc686550bc36d7563154fd33098741d-s2-agent-coordination-truth-classifications

Entry kind: code-receipt-accounting
Class: Judgment
Source digest: 8954a8e58c071d4fb3b88fbfcbdec5e16e70ab7fb53c5bda0172b9449441cd3a
Target digest: 8954a8e58c071d4fb3b88fbfcbdec5e16e70ab7fb53c5bda0172b9449441cd3a

### Merge accounting

```json
{
  "mode": "candidate-unverified",
  "originalReviewedRef": {
    "claimId": "claim_bdc686550bc36d7563154fd33098741d",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "reviewed",
    "reviewNote": "spec.md#contracts-owned: Unit contracts-owned (lines 73-73) sits in section contracts-owned: Ownership table links all exist (assignment-run-runresult.md, dispatch-control-plane.md, runtime-recovery-design.md, run-handle.md) and the history snapshot anchor passes.",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
    "reviewedAt": "2026-10-10",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
    "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea"
  },
  "currentPendingRef": {
    "claimId": "claim_bdc686550bc36d7563154fd33098741d",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "pending",
    "pendingReason": "A31 cited code changed; old receipt stays immutable history, current native unit candidate-unverified under A28; full truth check owed at promotion."
  },
  "completeOldReceipt": {
    "claimId": "claim_bdc686550bc36d7563154fd33098741d",
    "path": "docs/platform/agent-coordination/spec.md",
    "anchor": "contracts-owned",
    "unitDigest": "8954a8e58c071d4fb3b88fbfcbdec5e16e70ab7fb53c5bda0172b9449441cd3a",
    "shownText": "## Contracts Owned\n\nUnit/Workflow execution ownership is described by [docs/specs/runner.md](../../specs/runner.md). The surviving Assignment/Run dispatch contract is retained in this area's current contract and architecture documents; the runner spec does not supersede their complete recovery/control details.\n\n| Contract reading | Owner |\n|---|---|\n| Current execution | [Runner spec](../../specs/runner.md) and its executable owners |\n| Assignment, Run, RunResult and recovery/control boundaries | [Assignment contract](contracts/assignment-run-runresult.md), [dispatch architecture](architecture/dispatch-control-plane.md), [recovery](architecture/runtime-recovery-design.md), [run control](architecture/run-handle.md) |\n| Former coordination engine | [Verbatim historical spec](history/retired-engine/spec.md#literal-snapshot); not current schema authority |",
    "shownTextDigest": "5095df94ca030904ed97d28bc8e0d5fd697a900d312f6e58899bbaac4a1f248f",
    "class": "candidate-native-content",
    "authoredBy": "codex-session:1@2026-10-10",
    "rationale": "This current unit belongs to the truth-only section Agent Coordination Spec > Contracts Owned, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: verified. No prior verdict is carried to this receipt.",
    "truthSection": {
      "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
      "anchor": "contracts-owned",
      "status": "verified",
      "reason": null
    },
    "currentEvidence": {
      "commit": "af6c116f0e2af1f31f5e1d57830dc60de0c65411",
      "finding": "true-and-current",
      "citations": [
        {
          "path": "src/state/work.mjs",
          "startLine": 445,
          "endLine": 467,
          "blobSha": "154507cc747a6e83f3abc215c83f560cb02f459a"
        },
        {
          "path": "src/workflow/runner.mjs",
          "startLine": 419,
          "endLine": 428,
          "blobSha": "82f25b3dc6a5d8121874ec75566fb439b751edc5"
        },
        {
          "path": "src/runner/execution/run.mjs",
          "startLine": 331,
          "endLine": 340,
          "blobSha": "3f3202edfb9bc983cc042b441d45d10e8e089f6e"
        },
        {
          "path": "src/runner/dispatch/plan.mjs",
          "startLine": 444,
          "endLine": 461,
          "blobSha": "07dea2a62267ec3554b2b1d459dca82eb04e5483"
        }
      ],
      "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. The specific current code/consumer boundary is checked in the cited section.",
      "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
    }
  },
  "allCitationComparisons": [
    {
      "path": "src/workflow/runner.mjs",
      "beforeBlob": "82f25b3dc6a5d8121874ec75566fb439b751edc5",
      "afterBlob": "cda214f0e07b136e8ab1bca43f149a3a12cdac9f",
      "beforeStartLine": 419,
      "beforeEndLine": 428,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "          try {\n            unitRunResult = await runUnit({\n              unitData,\n              repoRoot: mainRoot,\n              cwd: unitWorktree,\n              worktree: unitWorktree,\n              pattern: unitPatternOf(u.template),\n              overrides: unitOverridesOf(u),\n              workflow: { runId: workflowRunId, stepId: step.id, unitId: u.id },\n            });",
      "excerptDigest": "464bfcfeea7fc87f66d4867e9c9b44be401a2d6973a48cce279949ef41939cac"
    },
    {
      "path": "src/runner/execution/run.mjs",
      "beforeBlob": "3f3202edfb9bc983cc042b441d45d10e8e089f6e",
      "afterBlob": "47eb3fc3f389ef9f0c0f0136277da1e34c89bb8b",
      "beforeStartLine": 331,
      "beforeEndLine": 340,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "      objective,\n      mutation: readOnly ? 'read-only' : 'mutating',\n      binding: bound,\n      provenance: {\n        kind: 'unit-run',\n        unitRunId,\n        role,\n        round,\n        binding: bound,\n      },",
      "excerptDigest": "c342412e8bfcfd827b25c3acbe23e02b5720070b0159481a35487b4b931f3d6b"
    }
  ],
  "receiptArtifact": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-sync-repin.json",
  "receiptCommit": "6c6a65e8543fa72012bd55f8999f13f9ed6193c4",
  "meaning": "Cited code changed; receipt remains immutable history, current unit candidate-unverified; no truth re-verification."
}
```

### Complete source / predecessor

Path/anchor: docs/platform/agent-coordination/spec.md#contracts-owned
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 8954a8e58c071d4fb3b88fbfcbdec5e16e70ab7fb53c5bda0172b9449441cd3a
Shown text SHA256: 5095df94ca030904ed97d28bc8e0d5fd697a900d312f6e58899bbaac4a1f248f
Lines: 73 to 73

```text
## Contracts Owned

Unit/Workflow execution ownership is described by [docs/specs/runner.md](../../specs/runner.md). The surviving Assignment/Run dispatch contract is retained in this area's current contract and architecture documents; the runner spec does not supersede their complete recovery/control details.

| Contract reading | Owner |
|---|---|
| Current execution | [Runner spec](../../specs/runner.md) and its executable owners |
| Assignment, Run, RunResult and recovery/control boundaries | [Assignment contract](contracts/assignment-run-runresult.md), [dispatch architecture](architecture/dispatch-control-plane.md), [recovery](architecture/runtime-recovery-design.md), [run control](architecture/run-handle.md) |
| Former coordination engine | [Verbatim historical spec](history/retired-engine/spec.md#literal-snapshot); not current schema authority |
```

### Complete target / successor

Path/anchor: docs/platform/agent-coordination/spec.md#contracts-owned
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 8954a8e58c071d4fb3b88fbfcbdec5e16e70ab7fb53c5bda0172b9449441cd3a
Shown text SHA256: 5095df94ca030904ed97d28bc8e0d5fd697a900d312f6e58899bbaac4a1f248f
Lines: 73 to 73

```text
## Contracts Owned

Unit/Workflow execution ownership is described by [docs/specs/runner.md](../../specs/runner.md). The surviving Assignment/Run dispatch contract is retained in this area's current contract and architecture documents; the runner spec does not supersede their complete recovery/control details.

| Contract reading | Owner |
|---|---|
| Current execution | [Runner spec](../../specs/runner.md) and its executable owners |
| Assignment, Run, RunResult and recovery/control boundaries | [Assignment contract](contracts/assignment-run-runresult.md), [dispatch architecture](architecture/dispatch-control-plane.md), [recovery](architecture/runtime-recovery-design.md), [run control](architecture/run-handle.md) |
| Former coordination engine | [Verbatim historical spec](history/retired-engine/spec.md#literal-snapshot); not current schema authority |
```

### Full diff

```diff

```

## receipt-claim_021a84c1334927bc8bba62ec12584496-s2-agent-coordination-truth-classifications

Entry kind: code-receipt-accounting
Class: Judgment
Source digest: 77a4cce54c6ebd9156e28f1d048925b0140f30f3e73682dc5a445d75143b611c
Target digest: 77a4cce54c6ebd9156e28f1d048925b0140f30f3e73682dc5a445d75143b611c

### Merge accounting

```json
{
  "mode": "candidate-unverified",
  "originalReviewedRef": {
    "claimId": "claim_021a84c1334927bc8bba62ec12584496",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "reviewed",
    "reviewNote": "spec.md#contracts-consumed: Unit contracts-consumed (lines 83-83) sits in section contracts-consumed: All four consumed owners exist (docs/specs/confinement-authority.md, host-invocation-routing and packaging-distribution READMEs); the hedge about Node dispatch paths is honest.",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
    "reviewedAt": "2026-10-10",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
    "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea"
  },
  "currentPendingRef": {
    "claimId": "claim_021a84c1334927bc8bba62ec12584496",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "pending",
    "pendingReason": "A31 cited code changed; old receipt stays immutable history, current native unit candidate-unverified under A28; full truth check owed at promotion."
  },
  "completeOldReceipt": {
    "claimId": "claim_021a84c1334927bc8bba62ec12584496",
    "path": "docs/platform/agent-coordination/spec.md",
    "anchor": "contracts-consumed",
    "unitDigest": "77a4cce54c6ebd9156e28f1d048925b0140f30f3e73682dc5a445d75143b611c",
    "shownText": "## Contracts Consumed\n\n| Contract area | Owner | Agent Coordination use |\n|---|---|---|\n| Work lifecycle and state | Work-state / runner specs | Optional Work integration; Work remains lifecycle authority. |\n| Host invocation and provider routing | [host-invocation-routing](../host-invocation-routing/README.md) | Adjacent process-routing authority; this page does not claim that every Node dispatch path consumes that component. |\n| Packaging/distribution | [packaging-distribution](../packaging-distribution/README.md) | Runtime identity, activation, setup/doctor, and release packaging are link-only external authority. |\n| Confinement Authority | [confinement-authority spec](../../specs/confinement-authority.md) | Execution confinement evidence and attestation may be consumed by dispatch paths. |",
    "shownTextDigest": "f365dd294b68f9bc38eae9fcc2f60cf76b3a61597da86b117e1aa3e607f03172",
    "class": "candidate-native-content",
    "authoredBy": "codex-session:1@2026-10-10",
    "rationale": "This current unit belongs to the truth-only section Agent Coordination Spec > Contracts Consumed, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: verified. No prior verdict is carried to this receipt.",
    "truthSection": {
      "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
      "anchor": "contracts-consumed",
      "status": "verified",
      "reason": null
    },
    "currentEvidence": {
      "commit": "af6c116f0e2af1f31f5e1d57830dc60de0c65411",
      "finding": "true-and-current",
      "citations": [
        {
          "path": "src/state/work.mjs",
          "startLine": 445,
          "endLine": 467,
          "blobSha": "154507cc747a6e83f3abc215c83f560cb02f459a"
        },
        {
          "path": "src/workflow/runner.mjs",
          "startLine": 419,
          "endLine": 428,
          "blobSha": "82f25b3dc6a5d8121874ec75566fb439b751edc5"
        },
        {
          "path": "src/runner/execution/run.mjs",
          "startLine": 331,
          "endLine": 340,
          "blobSha": "3f3202edfb9bc983cc042b441d45d10e8e089f6e"
        },
        {
          "path": "src/runner/dispatch/plan.mjs",
          "startLine": 444,
          "endLine": 461,
          "blobSha": "07dea2a62267ec3554b2b1d459dca82eb04e5483"
        }
      ],
      "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. The specific current code/consumer boundary is checked in the cited section.",
      "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
    }
  },
  "allCitationComparisons": [
    {
      "path": "src/workflow/runner.mjs",
      "beforeBlob": "82f25b3dc6a5d8121874ec75566fb439b751edc5",
      "afterBlob": "cda214f0e07b136e8ab1bca43f149a3a12cdac9f",
      "beforeStartLine": 419,
      "beforeEndLine": 428,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "          try {\n            unitRunResult = await runUnit({\n              unitData,\n              repoRoot: mainRoot,\n              cwd: unitWorktree,\n              worktree: unitWorktree,\n              pattern: unitPatternOf(u.template),\n              overrides: unitOverridesOf(u),\n              workflow: { runId: workflowRunId, stepId: step.id, unitId: u.id },\n            });",
      "excerptDigest": "464bfcfeea7fc87f66d4867e9c9b44be401a2d6973a48cce279949ef41939cac"
    },
    {
      "path": "src/runner/execution/run.mjs",
      "beforeBlob": "3f3202edfb9bc983cc042b441d45d10e8e089f6e",
      "afterBlob": "47eb3fc3f389ef9f0c0f0136277da1e34c89bb8b",
      "beforeStartLine": 331,
      "beforeEndLine": 340,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "      objective,\n      mutation: readOnly ? 'read-only' : 'mutating',\n      binding: bound,\n      provenance: {\n        kind: 'unit-run',\n        unitRunId,\n        role,\n        round,\n        binding: bound,\n      },",
      "excerptDigest": "c342412e8bfcfd827b25c3acbe23e02b5720070b0159481a35487b4b931f3d6b"
    }
  ],
  "receiptArtifact": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-sync-repin.json",
  "receiptCommit": "6c6a65e8543fa72012bd55f8999f13f9ed6193c4",
  "meaning": "Cited code changed; receipt remains immutable history, current unit candidate-unverified; no truth re-verification."
}
```

### Complete source / predecessor

Path/anchor: docs/platform/agent-coordination/spec.md#contracts-consumed
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 77a4cce54c6ebd9156e28f1d048925b0140f30f3e73682dc5a445d75143b611c
Shown text SHA256: f365dd294b68f9bc38eae9fcc2f60cf76b3a61597da86b117e1aa3e607f03172
Lines: 83 to 83

```text
## Contracts Consumed

| Contract area | Owner | Agent Coordination use |
|---|---|---|
| Work lifecycle and state | Work-state / runner specs | Optional Work integration; Work remains lifecycle authority. |
| Host invocation and provider routing | [host-invocation-routing](../host-invocation-routing/README.md) | Adjacent process-routing authority; this page does not claim that every Node dispatch path consumes that component. |
| Packaging/distribution | [packaging-distribution](../packaging-distribution/README.md) | Runtime identity, activation, setup/doctor, and release packaging are link-only external authority. |
| Confinement Authority | [confinement-authority spec](../../specs/confinement-authority.md) | Execution confinement evidence and attestation may be consumed by dispatch paths. |
```

### Complete target / successor

Path/anchor: docs/platform/agent-coordination/spec.md#contracts-consumed
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 77a4cce54c6ebd9156e28f1d048925b0140f30f3e73682dc5a445d75143b611c
Shown text SHA256: f365dd294b68f9bc38eae9fcc2f60cf76b3a61597da86b117e1aa3e607f03172
Lines: 83 to 83

```text
## Contracts Consumed

| Contract area | Owner | Agent Coordination use |
|---|---|---|
| Work lifecycle and state | Work-state / runner specs | Optional Work integration; Work remains lifecycle authority. |
| Host invocation and provider routing | [host-invocation-routing](../host-invocation-routing/README.md) | Adjacent process-routing authority; this page does not claim that every Node dispatch path consumes that component. |
| Packaging/distribution | [packaging-distribution](../packaging-distribution/README.md) | Runtime identity, activation, setup/doctor, and release packaging are link-only external authority. |
| Confinement Authority | [confinement-authority spec](../../specs/confinement-authority.md) | Execution confinement evidence and attestation may be consumed by dispatch paths. |
```

### Full diff

```diff

```

## receipt-claim_1289fd071fae40e82e7dba2d1b9bcbb2-s2-agent-coordination-truth-classifications

Entry kind: code-receipt-accounting
Class: Judgment
Source digest: f232658d9d154cf3a47fca9502c28ce4d658bd9ab26f1ebe4df7f13967d6e2df
Target digest: f232658d9d154cf3a47fca9502c28ce4d658bd9ab26f1ebe4df7f13967d6e2df

### Merge accounting

```json
{
  "mode": "candidate-unverified",
  "originalReviewedRef": {
    "claimId": "claim_1289fd071fae40e82e7dba2d1b9bcbb2",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "reviewed",
    "reviewNote": "spec.md#implementation-status: Unit implementation-status (lines 92-92) sits in section implementation-status: Dormant session-ownership check claim verified: findCoordinationSessionOwningAssignment (runtime-inspection.mjs:131) used by recover.mjs:292 and reconciliation-planner.mjs:274; engine removal commit confirmed.",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
    "reviewedAt": "2026-10-10",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
    "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea"
  },
  "currentPendingRef": {
    "claimId": "claim_1289fd071fae40e82e7dba2d1b9bcbb2",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "pending",
    "pendingReason": "A31 cited code changed; old receipt stays immutable history, current native unit candidate-unverified under A28; full truth check owed at promotion."
  },
  "completeOldReceipt": {
    "claimId": "claim_1289fd071fae40e82e7dba2d1b9bcbb2",
    "path": "docs/platform/agent-coordination/spec.md",
    "anchor": "implementation-status",
    "unitDigest": "f232658d9d154cf3a47fca9502c28ce4d658bd9ab26f1ebe4df7f13967d6e2df",
    "shownText": "## Implementation Status\n\nThe coordination CLI/engine was removed in `2180b4e72701bb090288af8fe8021008d9d42079`. Current execution is inspected through `src/runner/execution/`, `src/workflow/` and the surviving `src/runner/dispatch/` owners. Dormant session-ownership checks still exist in dispatch recovery; their presence does not restore the retired CLI/engine. The dated implementation/status table is [preserved verbatim](history/retired-engine/spec.md#literal-snapshot).\n\nThe former claim-by-claim evidence table is [retained history](history/retired-engine/verification/implementation-alignment.md#literal-snapshot), not proof of current implementation.",
    "shownTextDigest": "b371c915658c3537c794b68c7a2123de306747e4520742b7255c97aa476c2d1c",
    "class": "candidate-native-content",
    "authoredBy": "codex-session:1@2026-10-10",
    "rationale": "This current unit belongs to the truth-only section Agent Coordination Spec > Implementation Status, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: verified. No prior verdict is carried to this receipt.",
    "truthSection": {
      "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
      "anchor": "implementation-status",
      "status": "verified",
      "reason": null
    },
    "currentEvidence": {
      "commit": "af6c116f0e2af1f31f5e1d57830dc60de0c65411",
      "finding": "true-and-current",
      "citations": [
        {
          "path": "src/state/work.mjs",
          "startLine": 445,
          "endLine": 467,
          "blobSha": "154507cc747a6e83f3abc215c83f560cb02f459a"
        },
        {
          "path": "src/workflow/runner.mjs",
          "startLine": 419,
          "endLine": 428,
          "blobSha": "82f25b3dc6a5d8121874ec75566fb439b751edc5"
        },
        {
          "path": "src/runner/execution/run.mjs",
          "startLine": 331,
          "endLine": 340,
          "blobSha": "3f3202edfb9bc983cc042b441d45d10e8e089f6e"
        },
        {
          "path": "src/runner/dispatch/plan.mjs",
          "startLine": 444,
          "endLine": 461,
          "blobSha": "07dea2a62267ec3554b2b1d459dca82eb04e5483"
        }
      ],
      "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. The specific current code/consumer boundary is checked in the cited section.",
      "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
    }
  },
  "allCitationComparisons": [
    {
      "path": "src/workflow/runner.mjs",
      "beforeBlob": "82f25b3dc6a5d8121874ec75566fb439b751edc5",
      "afterBlob": "cda214f0e07b136e8ab1bca43f149a3a12cdac9f",
      "beforeStartLine": 419,
      "beforeEndLine": 428,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "          try {\n            unitRunResult = await runUnit({\n              unitData,\n              repoRoot: mainRoot,\n              cwd: unitWorktree,\n              worktree: unitWorktree,\n              pattern: unitPatternOf(u.template),\n              overrides: unitOverridesOf(u),\n              workflow: { runId: workflowRunId, stepId: step.id, unitId: u.id },\n            });",
      "excerptDigest": "464bfcfeea7fc87f66d4867e9c9b44be401a2d6973a48cce279949ef41939cac"
    },
    {
      "path": "src/runner/execution/run.mjs",
      "beforeBlob": "3f3202edfb9bc983cc042b441d45d10e8e089f6e",
      "afterBlob": "47eb3fc3f389ef9f0c0f0136277da1e34c89bb8b",
      "beforeStartLine": 331,
      "beforeEndLine": 340,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "      objective,\n      mutation: readOnly ? 'read-only' : 'mutating',\n      binding: bound,\n      provenance: {\n        kind: 'unit-run',\n        unitRunId,\n        role,\n        round,\n        binding: bound,\n      },",
      "excerptDigest": "c342412e8bfcfd827b25c3acbe23e02b5720070b0159481a35487b4b931f3d6b"
    }
  ],
  "receiptArtifact": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-sync-repin.json",
  "receiptCommit": "6c6a65e8543fa72012bd55f8999f13f9ed6193c4",
  "meaning": "Cited code changed; receipt remains immutable history, current unit candidate-unverified; no truth re-verification."
}
```

### Complete source / predecessor

Path/anchor: docs/platform/agent-coordination/spec.md#implementation-status
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: f232658d9d154cf3a47fca9502c28ce4d658bd9ab26f1ebe4df7f13967d6e2df
Shown text SHA256: b371c915658c3537c794b68c7a2123de306747e4520742b7255c97aa476c2d1c
Lines: 92 to 92

```text
## Implementation Status

The coordination CLI/engine was removed in `2180b4e72701bb090288af8fe8021008d9d42079`. Current execution is inspected through `src/runner/execution/`, `src/workflow/` and the surviving `src/runner/dispatch/` owners. Dormant session-ownership checks still exist in dispatch recovery; their presence does not restore the retired CLI/engine. The dated implementation/status table is [preserved verbatim](history/retired-engine/spec.md#literal-snapshot).

The former claim-by-claim evidence table is [retained history](history/retired-engine/verification/implementation-alignment.md#literal-snapshot), not proof of current implementation.
```

### Complete target / successor

Path/anchor: docs/platform/agent-coordination/spec.md#implementation-status
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: f232658d9d154cf3a47fca9502c28ce4d658bd9ab26f1ebe4df7f13967d6e2df
Shown text SHA256: b371c915658c3537c794b68c7a2123de306747e4520742b7255c97aa476c2d1c
Lines: 92 to 92

```text
## Implementation Status

The coordination CLI/engine was removed in `2180b4e72701bb090288af8fe8021008d9d42079`. Current execution is inspected through `src/runner/execution/`, `src/workflow/` and the surviving `src/runner/dispatch/` owners. Dormant session-ownership checks still exist in dispatch recovery; their presence does not restore the retired CLI/engine. The dated implementation/status table is [preserved verbatim](history/retired-engine/spec.md#literal-snapshot).

The former claim-by-claim evidence table is [retained history](history/retired-engine/verification/implementation-alignment.md#literal-snapshot), not proof of current implementation.
```

### Full diff

```diff

```

## receipt-claim_abd1a1964d80a8d3e5635ba17cd386cf-s2-agent-coordination-truth-classifications

Entry kind: code-receipt-accounting
Class: Judgment
Source digest: 3f383f339cf24fdf13f5b2aadafcaa75186e3fa8c386bcb8aa4da976f3e8fb51
Target digest: 3f383f339cf24fdf13f5b2aadafcaa75186e3fa8c386bcb8aa4da976f3e8fb51

### Merge accounting

```json
{
  "mode": "candidate-unverified",
  "originalReviewedRef": {
    "claimId": "claim_abd1a1964d80a8d3e5635ba17cd386cf",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "reviewed",
    "reviewNote": "spec.md#known-gaps: Unit known-gaps (lines 98-98) sits in section known-gaps: Pointer to retained history and runner spec only; no status claim of its own.",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
    "reviewedAt": "2026-10-10",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
    "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea"
  },
  "currentPendingRef": {
    "claimId": "claim_abd1a1964d80a8d3e5635ba17cd386cf",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "pending",
    "pendingReason": "A31 cited code changed; old receipt stays immutable history, current native unit candidate-unverified under A28; full truth check owed at promotion."
  },
  "completeOldReceipt": {
    "claimId": "claim_abd1a1964d80a8d3e5635ba17cd386cf",
    "path": "docs/platform/agent-coordination/spec.md",
    "anchor": "known-gaps",
    "unitDigest": "3f383f339cf24fdf13f5b2aadafcaa75186e3fa8c386bcb8aa4da976f3e8fb51",
    "shownText": "## Known Gaps\n\nThe former gap/status list is [retained verbatim](history/retired-engine/spec.md#literal-snapshot). It is not a current implementation backlog; use [the current owner](../../specs/runner.md) when assessing present execution.",
    "shownTextDigest": "63e40f517aefdb7cb90b31755af6c5785ef5461672f08599c6887bdf027ba086",
    "class": "candidate-native-content",
    "authoredBy": "codex-session:1@2026-10-10",
    "rationale": "This current unit belongs to the truth-only section Agent Coordination Spec > Known Gaps, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: verified. No prior verdict is carried to this receipt.",
    "truthSection": {
      "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
      "anchor": "known-gaps",
      "status": "verified",
      "reason": null
    },
    "currentEvidence": {
      "commit": "af6c116f0e2af1f31f5e1d57830dc60de0c65411",
      "finding": "true-and-current",
      "citations": [
        {
          "path": "src/state/work.mjs",
          "startLine": 445,
          "endLine": 467,
          "blobSha": "154507cc747a6e83f3abc215c83f560cb02f459a"
        },
        {
          "path": "src/workflow/runner.mjs",
          "startLine": 419,
          "endLine": 428,
          "blobSha": "82f25b3dc6a5d8121874ec75566fb439b751edc5"
        },
        {
          "path": "src/runner/execution/run.mjs",
          "startLine": 331,
          "endLine": 340,
          "blobSha": "3f3202edfb9bc983cc042b441d45d10e8e089f6e"
        },
        {
          "path": "src/runner/dispatch/plan.mjs",
          "startLine": 444,
          "endLine": 461,
          "blobSha": "07dea2a62267ec3554b2b1d459dca82eb04e5483"
        }
      ],
      "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. The specific current code/consumer boundary is checked in the cited section.",
      "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
    }
  },
  "allCitationComparisons": [
    {
      "path": "src/workflow/runner.mjs",
      "beforeBlob": "82f25b3dc6a5d8121874ec75566fb439b751edc5",
      "afterBlob": "cda214f0e07b136e8ab1bca43f149a3a12cdac9f",
      "beforeStartLine": 419,
      "beforeEndLine": 428,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "          try {\n            unitRunResult = await runUnit({\n              unitData,\n              repoRoot: mainRoot,\n              cwd: unitWorktree,\n              worktree: unitWorktree,\n              pattern: unitPatternOf(u.template),\n              overrides: unitOverridesOf(u),\n              workflow: { runId: workflowRunId, stepId: step.id, unitId: u.id },\n            });",
      "excerptDigest": "464bfcfeea7fc87f66d4867e9c9b44be401a2d6973a48cce279949ef41939cac"
    },
    {
      "path": "src/runner/execution/run.mjs",
      "beforeBlob": "3f3202edfb9bc983cc042b441d45d10e8e089f6e",
      "afterBlob": "47eb3fc3f389ef9f0c0f0136277da1e34c89bb8b",
      "beforeStartLine": 331,
      "beforeEndLine": 340,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "      objective,\n      mutation: readOnly ? 'read-only' : 'mutating',\n      binding: bound,\n      provenance: {\n        kind: 'unit-run',\n        unitRunId,\n        role,\n        round,\n        binding: bound,\n      },",
      "excerptDigest": "c342412e8bfcfd827b25c3acbe23e02b5720070b0159481a35487b4b931f3d6b"
    }
  ],
  "receiptArtifact": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-sync-repin.json",
  "receiptCommit": "6c6a65e8543fa72012bd55f8999f13f9ed6193c4",
  "meaning": "Cited code changed; receipt remains immutable history, current unit candidate-unverified; no truth re-verification."
}
```

### Complete source / predecessor

Path/anchor: docs/platform/agent-coordination/spec.md#known-gaps
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 3f383f339cf24fdf13f5b2aadafcaa75186e3fa8c386bcb8aa4da976f3e8fb51
Shown text SHA256: 63e40f517aefdb7cb90b31755af6c5785ef5461672f08599c6887bdf027ba086
Lines: 98 to 98

```text
## Known Gaps

The former gap/status list is [retained verbatim](history/retired-engine/spec.md#literal-snapshot). It is not a current implementation backlog; use [the current owner](../../specs/runner.md) when assessing present execution.
```

### Complete target / successor

Path/anchor: docs/platform/agent-coordination/spec.md#known-gaps
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 3f383f339cf24fdf13f5b2aadafcaa75186e3fa8c386bcb8aa4da976f3e8fb51
Shown text SHA256: 63e40f517aefdb7cb90b31755af6c5785ef5461672f08599c6887bdf027ba086
Lines: 98 to 98

```text
## Known Gaps

The former gap/status list is [retained verbatim](history/retired-engine/spec.md#literal-snapshot). It is not a current implementation backlog; use [the current owner](../../specs/runner.md) when assessing present execution.
```

### Full diff

```diff

```

## receipt-claim_9a3c360e46f16369ea4820a1b8bfbcca-s2-agent-coordination-truth-classifications

Entry kind: code-receipt-accounting
Class: Judgment
Source digest: cea23d290f75e2ac209e82cee5494f046e4a68e4d930c1c95099f8a5030e1bd2
Target digest: cea23d290f75e2ac209e82cee5494f046e4a68e4d930c1c95099f8a5030e1bd2

### Merge accounting

```json
{
  "mode": "candidate-unverified",
  "originalReviewedRef": {
    "claimId": "claim_9a3c360e46f16369ea4820a1b8bfbcca",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "reviewed",
    "reviewNote": "spec.md#related-files: Unit related-files (lines 102-102) sits in section related-files: Every row link resolves (scripted check), including history/retired-engine/verification/implementation-alignment.md#literal-snapshot.",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
    "reviewedAt": "2026-10-10",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
    "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea"
  },
  "currentPendingRef": {
    "claimId": "claim_9a3c360e46f16369ea4820a1b8bfbcca",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "pending",
    "pendingReason": "A31 cited code changed; old receipt stays immutable history, current native unit candidate-unverified under A28; full truth check owed at promotion."
  },
  "completeOldReceipt": {
    "claimId": "claim_9a3c360e46f16369ea4820a1b8bfbcca",
    "path": "docs/platform/agent-coordination/spec.md",
    "anchor": "related-files",
    "unitDigest": "cea23d290f75e2ac209e82cee5494f046e4a68e4d930c1c95099f8a5030e1bd2",
    "shownText": "## Related Files\n\n| Relationship | File |\n|---|---|\n| area portal | [README.md](README.md) |\n| current owner | [runner spec](../../specs/runner.md) |\n| complete former spec | [retired-engine snapshot](history/retired-engine/spec.md#literal-snapshot) |\n| former implementation alignment | [historical snapshot](history/retired-engine/verification/implementation-alignment.md#literal-snapshot) |",
    "shownTextDigest": "f5298a43623749b1df64ec0d2f760d4728ede65d07921fe850f5f9813c1846cf",
    "class": "candidate-native-content",
    "authoredBy": "codex-session:1@2026-10-10",
    "rationale": "This current unit belongs to the truth-only section Agent Coordination Spec > Related Files, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: verified. No prior verdict is carried to this receipt.",
    "truthSection": {
      "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
      "anchor": "related-files",
      "status": "verified",
      "reason": null
    },
    "currentEvidence": {
      "commit": "af6c116f0e2af1f31f5e1d57830dc60de0c65411",
      "finding": "true-and-current",
      "citations": [
        {
          "path": "src/state/work.mjs",
          "startLine": 445,
          "endLine": 467,
          "blobSha": "154507cc747a6e83f3abc215c83f560cb02f459a"
        },
        {
          "path": "src/workflow/runner.mjs",
          "startLine": 419,
          "endLine": 428,
          "blobSha": "82f25b3dc6a5d8121874ec75566fb439b751edc5"
        },
        {
          "path": "src/runner/execution/run.mjs",
          "startLine": 331,
          "endLine": 340,
          "blobSha": "3f3202edfb9bc983cc042b441d45d10e8e089f6e"
        },
        {
          "path": "src/runner/dispatch/plan.mjs",
          "startLine": 444,
          "endLine": 461,
          "blobSha": "07dea2a62267ec3554b2b1d459dca82eb04e5483"
        }
      ],
      "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. The specific current code/consumer boundary is checked in the cited section.",
      "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
    }
  },
  "allCitationComparisons": [
    {
      "path": "src/workflow/runner.mjs",
      "beforeBlob": "82f25b3dc6a5d8121874ec75566fb439b751edc5",
      "afterBlob": "cda214f0e07b136e8ab1bca43f149a3a12cdac9f",
      "beforeStartLine": 419,
      "beforeEndLine": 428,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "          try {\n            unitRunResult = await runUnit({\n              unitData,\n              repoRoot: mainRoot,\n              cwd: unitWorktree,\n              worktree: unitWorktree,\n              pattern: unitPatternOf(u.template),\n              overrides: unitOverridesOf(u),\n              workflow: { runId: workflowRunId, stepId: step.id, unitId: u.id },\n            });",
      "excerptDigest": "464bfcfeea7fc87f66d4867e9c9b44be401a2d6973a48cce279949ef41939cac"
    },
    {
      "path": "src/runner/execution/run.mjs",
      "beforeBlob": "3f3202edfb9bc983cc042b441d45d10e8e089f6e",
      "afterBlob": "47eb3fc3f389ef9f0c0f0136277da1e34c89bb8b",
      "beforeStartLine": 331,
      "beforeEndLine": 340,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "      objective,\n      mutation: readOnly ? 'read-only' : 'mutating',\n      binding: bound,\n      provenance: {\n        kind: 'unit-run',\n        unitRunId,\n        role,\n        round,\n        binding: bound,\n      },",
      "excerptDigest": "c342412e8bfcfd827b25c3acbe23e02b5720070b0159481a35487b4b931f3d6b"
    }
  ],
  "receiptArtifact": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-sync-repin.json",
  "receiptCommit": "6c6a65e8543fa72012bd55f8999f13f9ed6193c4",
  "meaning": "Cited code changed; receipt remains immutable history, current unit candidate-unverified; no truth re-verification."
}
```

### Complete source / predecessor

Path/anchor: docs/platform/agent-coordination/spec.md#related-files
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: cea23d290f75e2ac209e82cee5494f046e4a68e4d930c1c95099f8a5030e1bd2
Shown text SHA256: f5298a43623749b1df64ec0d2f760d4728ede65d07921fe850f5f9813c1846cf
Lines: 102 to 102

```text
## Related Files

| Relationship | File |
|---|---|
| area portal | [README.md](README.md) |
| current owner | [runner spec](../../specs/runner.md) |
| complete former spec | [retired-engine snapshot](history/retired-engine/spec.md#literal-snapshot) |
| former implementation alignment | [historical snapshot](history/retired-engine/verification/implementation-alignment.md#literal-snapshot) |
```

### Complete target / successor

Path/anchor: docs/platform/agent-coordination/spec.md#related-files
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: cea23d290f75e2ac209e82cee5494f046e4a68e4d930c1c95099f8a5030e1bd2
Shown text SHA256: f5298a43623749b1df64ec0d2f760d4728ede65d07921fe850f5f9813c1846cf
Lines: 102 to 102

```text
## Related Files

| Relationship | File |
|---|---|
| area portal | [README.md](README.md) |
| current owner | [runner spec](../../specs/runner.md) |
| complete former spec | [retired-engine snapshot](history/retired-engine/spec.md#literal-snapshot) |
| former implementation alignment | [historical snapshot](history/retired-engine/verification/implementation-alignment.md#literal-snapshot) |
```

### Full diff

```diff

```

## receipt-claim_f981631cd89e4bb32875daad697892de-s2-agent-coordination-truth-classifications

Entry kind: code-receipt-accounting
Class: Judgment
Source digest: 5c63c31867235bdfebc3b0771fbeef56fdfe886b2c0d6a76fcc5d9a4cee7507e
Target digest: 5c63c31867235bdfebc3b0771fbeef56fdfe886b2c0d6a76fcc5d9a4cee7507e

### Merge accounting

````json
{
  "mode": "candidate-unverified",
  "originalReviewedRef": {
    "claimId": "claim_f981631cd89e4bb32875daad697892de",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "reviewed",
    "reviewNote": "verification/README.md#agent-coordination-verification: Unit agent-coordination-verification (lines 1-1) in verification index section agent-coordination-verification: checked against the repo, no false current-state claim; Header and snapshot link are honest.",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
    "reviewedAt": "2026-10-10",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
    "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea"
  },
  "currentPendingRef": {
    "claimId": "claim_f981631cd89e4bb32875daad697892de",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "pending",
    "pendingReason": "A31 cited code changed; old receipt stays immutable history, current native unit candidate-unverified under A28; full truth check owed at promotion."
  },
  "completeOldReceipt": {
    "claimId": "claim_f981631cd89e4bb32875daad697892de",
    "path": "docs/platform/agent-coordination/verification/README.md",
    "anchor": "agent-coordination-verification",
    "unitDigest": "5c63c31867235bdfebc3b0771fbeef56fdfe886b2c0d6a76fcc5d9a4cee7507e",
    "shownText": "# Agent Coordination Verification\n\n```txt\nDocument type: Collection index\nAudience: Maintainer, implementation agent and independent reviewer\nPurpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history\nDesign status: Candidate\nImplementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims\nProvenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review\nWriter type: Human + agent coauthor\nCanonical for: The current subject and design boundaries stated in this file; not retired engine authority\nUse this when: Reading the surviving contract, its implementation limits or current proposals\nDo not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior\nLast reviewed: Pending independent liveness re-review\nRelated:\n- docs/platform/agent-coordination/README.md\n- docs/specs/runner.md\nSupersedes: Incorrect whole-file retirement or over-removal only\nSuperseded by: None for the surviving current subject\nAdded in candidate: Liveness evidence and explicit implementation/proposal distinction\n```\n\nComplete pre-rework input: [historical snapshot](../history/retired-engine/files/verification/README.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.",
    "shownTextDigest": "395f13b59c37ebd347bf7904a7f1aa0f192b85c4484e392c132df4400685d2fc",
    "class": "candidate-native-content",
    "authoredBy": "codex-session:1@2026-10-10",
    "rationale": "This current unit belongs to the truth-only section Agent Coordination Verification, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: verified. No prior verdict is carried to this receipt.",
    "truthSection": {
      "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
      "anchor": "agent-coordination-verification",
      "status": "verified",
      "reason": null
    },
    "currentEvidence": {
      "commit": "af6c116f0e2af1f31f5e1d57830dc60de0c65411",
      "finding": "true-and-current",
      "citations": [
        {
          "path": "src/state/work.mjs",
          "startLine": 445,
          "endLine": 467,
          "blobSha": "154507cc747a6e83f3abc215c83f560cb02f459a"
        },
        {
          "path": "src/workflow/runner.mjs",
          "startLine": 419,
          "endLine": 428,
          "blobSha": "82f25b3dc6a5d8121874ec75566fb439b751edc5"
        },
        {
          "path": "src/runner/execution/run.mjs",
          "startLine": 331,
          "endLine": 340,
          "blobSha": "3f3202edfb9bc983cc042b441d45d10e8e089f6e"
        },
        {
          "path": "src/runner/dispatch/plan.mjs",
          "startLine": 444,
          "endLine": 461,
          "blobSha": "07dea2a62267ec3554b2b1d459dca82eb04e5483"
        }
      ],
      "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. The specific current code/consumer boundary is checked in the cited section.",
      "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
    }
  },
  "allCitationComparisons": [
    {
      "path": "src/workflow/runner.mjs",
      "beforeBlob": "82f25b3dc6a5d8121874ec75566fb439b751edc5",
      "afterBlob": "cda214f0e07b136e8ab1bca43f149a3a12cdac9f",
      "beforeStartLine": 419,
      "beforeEndLine": 428,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "          try {\n            unitRunResult = await runUnit({\n              unitData,\n              repoRoot: mainRoot,\n              cwd: unitWorktree,\n              worktree: unitWorktree,\n              pattern: unitPatternOf(u.template),\n              overrides: unitOverridesOf(u),\n              workflow: { runId: workflowRunId, stepId: step.id, unitId: u.id },\n            });",
      "excerptDigest": "464bfcfeea7fc87f66d4867e9c9b44be401a2d6973a48cce279949ef41939cac"
    },
    {
      "path": "src/runner/execution/run.mjs",
      "beforeBlob": "3f3202edfb9bc983cc042b441d45d10e8e089f6e",
      "afterBlob": "47eb3fc3f389ef9f0c0f0136277da1e34c89bb8b",
      "beforeStartLine": 331,
      "beforeEndLine": 340,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "      objective,\n      mutation: readOnly ? 'read-only' : 'mutating',\n      binding: bound,\n      provenance: {\n        kind: 'unit-run',\n        unitRunId,\n        role,\n        round,\n        binding: bound,\n      },",
      "excerptDigest": "c342412e8bfcfd827b25c3acbe23e02b5720070b0159481a35487b4b931f3d6b"
    }
  ],
  "receiptArtifact": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-sync-repin.json",
  "receiptCommit": "6c6a65e8543fa72012bd55f8999f13f9ed6193c4",
  "meaning": "Cited code changed; receipt remains immutable history, current unit candidate-unverified; no truth re-verification."
}
````

### Complete source / predecessor

Path/anchor: docs/platform/agent-coordination/verification/README.md#agent-coordination-verification
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 5c63c31867235bdfebc3b0771fbeef56fdfe886b2c0d6a76fcc5d9a4cee7507e
Shown text SHA256: 395f13b59c37ebd347bf7904a7f1aa0f192b85c4484e392c132df4400685d2fc
Lines: 1 to 1

````text
# Agent Coordination Verification

```txt
Document type: Collection index
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/verification/README.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
````

### Complete target / successor

Path/anchor: docs/platform/agent-coordination/verification/README.md#agent-coordination-verification
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 5c63c31867235bdfebc3b0771fbeef56fdfe886b2c0d6a76fcc5d9a4cee7507e
Shown text SHA256: 395f13b59c37ebd347bf7904a7f1aa0f192b85c4484e392c132df4400685d2fc
Lines: 1 to 1

````text
# Agent Coordination Verification

```txt
Document type: Collection index
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/verification/README.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
````

### Full diff

```diff

```

## receipt-claim_27d729cd2866cff1ad420282e91aacb3-s2-agent-coordination-truth-classifications

Entry kind: code-receipt-accounting
Class: Judgment
Source digest: 24ac5779753cd6be2f9beb3cfb13970695327154a94021e00c3ddc0040a59d72
Target digest: 24ac5779753cd6be2f9beb3cfb13970695327154a94021e00c3ddc0040a59d72

### Merge accounting

```json
{
  "mode": "candidate-unverified",
  "originalReviewedRef": {
    "claimId": "claim_27d729cd2866cff1ad420282e91aacb3",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "reviewed",
    "reviewNote": "verification/README.md#evidence-sets: Unit evidence-sets (lines 25-25) in verification index section evidence-sets: checked against the repo, no false current-state claim; All 17 collection rows match the 17 actual directories under verification/ (ls).",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-10",
    "reviewedAt": "2026-10-10",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md",
    "reviewReportCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea"
  },
  "currentPendingRef": {
    "claimId": "claim_27d729cd2866cff1ad420282e91aacb3",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-truth.json",
    "receiptCommit": "f7adbc425808460da17f3b2c5386e1b05bbe6103",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "pending",
    "pendingReason": "A31 cited code changed; old receipt stays immutable history, current native unit candidate-unverified under A28; full truth check owed at promotion."
  },
  "completeOldReceipt": {
    "claimId": "claim_27d729cd2866cff1ad420282e91aacb3",
    "path": "docs/platform/agent-coordination/verification/README.md",
    "anchor": "evidence-sets",
    "unitDigest": "24ac5779753cd6be2f9beb3cfb13970695327154a94021e00c3ddc0040a59d72",
    "shownText": "## Evidence Sets\n\nThese are dated physical evidence collections, not proof that every tested runtime still exists or that the files were re-verified. Step 08 CoordinationSession/FlowDefinition and all three Step 09 session-protocol collections are historical engine evidence. Other collections also require their individual dates, commits and current owners: old code-panel/plan-loop proof is not proof that removed facades still ship. All payload bytes remain unchanged.\n\n| Collection | Reading location |\n|---|---|\n| architecture-advisory-panel | [architecture-advisory-panel](architecture-advisory-panel/) |\n| code-implementation-track-policy | [code-implementation-track-policy](code-implementation-track-policy/) |\n| code-panel-multicell-facade | [code-panel-multicell-facade](code-panel-multicell-facade/) |\n| confinement-authority-implementation | [confinement-authority-implementation](confinement-authority-implementation/) |\n| coordination-envelope | [coordination-envelope](coordination-envelope/) |\n| dispatch-operability-implementation | [dispatch-operability-implementation](dispatch-operability-implementation/) |\n| executor-policy-dispatch-seams | [executor-policy-dispatch-seams](executor-policy-dispatch-seams/) |\n| group-thinking-plan-loop | [group-thinking-plan-loop](group-thinking-plan-loop/) |\n| runtime-recovery | [runtime-recovery](runtime-recovery/) |\n| rust-host-r1-kernel | [rust-host-r1-kernel](rust-host-r1-kernel/) |\n| step-07-mvp | [step-07-mvp](step-07-mvp/) |\n| step-08-standalone-coordination | [step-08-standalone-coordination](step-08-standalone-coordination/) |\n| step-09-group-thinking-mvp1-mvp2 | [step-09-group-thinking-mvp1-mvp2](step-09-group-thinking-mvp1-mvp2/) |\n| step-09-mvp3-to-mvp5 | [step-09-mvp3-to-mvp5](step-09-mvp3-to-mvp5/) |\n| step-09-mvp6-to-mvp9 | [step-09-mvp6-to-mvp9](step-09-mvp6-to-mvp9/) |\n| team-dispatch-v1 | [team-dispatch-v1](team-dispatch-v1/) |\n| visibility-herdr | [visibility-herdr](visibility-herdr/) |\n\nThe current runtime owners are dispatch Assignment/Run/RunResult, Unit/CollaborationPattern and Workflow. Their current documents and the historical engine snapshots are linked from the area portal. A transcript, pane state or passing old proof does not establish current implementation authority.",
    "shownTextDigest": "d45f468176e422e1f9f40b7ab437984a89aad32d9d6e03953c002ae89c8ae5be",
    "class": "candidate-native-content",
    "authoredBy": "codex-session:1@2026-10-10",
    "rationale": "This current unit belongs to the truth-only section Agent Coordination Verification > Evidence Sets, pinned at 96a13ab21670e1f5d9748c02cd615ea5598b53f5. Its full shown text, class and code/design boundary require independent review. The accepted carriage and all historical/payload bytes are unchanged. Author section status: verified. No prior verdict is carried to this receipt.",
    "truthSection": {
      "ledger": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json",
      "anchor": "evidence-sets",
      "status": "verified",
      "reason": null
    },
    "currentEvidence": {
      "commit": "af6c116f0e2af1f31f5e1d57830dc60de0c65411",
      "finding": "true-and-current",
      "citations": [
        {
          "path": "src/state/work.mjs",
          "startLine": 445,
          "endLine": 467,
          "blobSha": "154507cc747a6e83f3abc215c83f560cb02f459a"
        },
        {
          "path": "src/workflow/runner.mjs",
          "startLine": 419,
          "endLine": 428,
          "blobSha": "82f25b3dc6a5d8121874ec75566fb439b751edc5"
        },
        {
          "path": "src/runner/execution/run.mjs",
          "startLine": 331,
          "endLine": 340,
          "blobSha": "3f3202edfb9bc983cc042b441d45d10e8e089f6e"
        },
        {
          "path": "src/runner/dispatch/plan.mjs",
          "startLine": 444,
          "endLine": 461,
          "blobSha": "07dea2a62267ec3554b2b1d459dca82eb04e5483"
        }
      ],
      "scope": "This binding claims only that the shown text states the checked current contract and honestly labels manual guidance, unimplemented design or dated/unexecuted proof. It does not claim those proposals or historical scenarios have been implemented or exercised. The specific current code/consumer boundary is checked in the cited section.",
      "evidenceReport": "plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json"
    }
  },
  "allCitationComparisons": [
    {
      "path": "src/workflow/runner.mjs",
      "beforeBlob": "82f25b3dc6a5d8121874ec75566fb439b751edc5",
      "afterBlob": "cda214f0e07b136e8ab1bca43f149a3a12cdac9f",
      "beforeStartLine": 419,
      "beforeEndLine": 428,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "          try {\n            unitRunResult = await runUnit({\n              unitData,\n              repoRoot: mainRoot,\n              cwd: unitWorktree,\n              worktree: unitWorktree,\n              pattern: unitPatternOf(u.template),\n              overrides: unitOverridesOf(u),\n              workflow: { runId: workflowRunId, stepId: step.id, unitId: u.id },\n            });",
      "excerptDigest": "464bfcfeea7fc87f66d4867e9c9b44be401a2d6973a48cce279949ef41939cac"
    },
    {
      "path": "src/runner/execution/run.mjs",
      "beforeBlob": "3f3202edfb9bc983cc042b441d45d10e8e089f6e",
      "afterBlob": "47eb3fc3f389ef9f0c0f0136277da1e34c89bb8b",
      "beforeStartLine": 331,
      "beforeEndLine": 340,
      "startLine": null,
      "endLine": null,
      "status": "changed",
      "excerpt": "      objective,\n      mutation: readOnly ? 'read-only' : 'mutating',\n      binding: bound,\n      provenance: {\n        kind: 'unit-run',\n        unitRunId,\n        role,\n        round,\n        binding: bound,\n      },",
      "excerptDigest": "c342412e8bfcfd827b25c3acbe23e02b5720070b0159481a35487b4b931f3d6b"
    }
  ],
  "receiptArtifact": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-sync-repin.json",
  "receiptCommit": "6c6a65e8543fa72012bd55f8999f13f9ed6193c4",
  "meaning": "Cited code changed; receipt remains immutable history, current unit candidate-unverified; no truth re-verification."
}
```

### Complete source / predecessor

Path/anchor: docs/platform/agent-coordination/verification/README.md#evidence-sets
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 24ac5779753cd6be2f9beb3cfb13970695327154a94021e00c3ddc0040a59d72
Shown text SHA256: d45f468176e422e1f9f40b7ab437984a89aad32d9d6e03953c002ae89c8ae5be
Lines: 25 to 25

```text
## Evidence Sets

These are dated physical evidence collections, not proof that every tested runtime still exists or that the files were re-verified. Step 08 CoordinationSession/FlowDefinition and all three Step 09 session-protocol collections are historical engine evidence. Other collections also require their individual dates, commits and current owners: old code-panel/plan-loop proof is not proof that removed facades still ship. All payload bytes remain unchanged.

| Collection | Reading location |
|---|---|
| architecture-advisory-panel | [architecture-advisory-panel](architecture-advisory-panel/) |
| code-implementation-track-policy | [code-implementation-track-policy](code-implementation-track-policy/) |
| code-panel-multicell-facade | [code-panel-multicell-facade](code-panel-multicell-facade/) |
| confinement-authority-implementation | [confinement-authority-implementation](confinement-authority-implementation/) |
| coordination-envelope | [coordination-envelope](coordination-envelope/) |
| dispatch-operability-implementation | [dispatch-operability-implementation](dispatch-operability-implementation/) |
| executor-policy-dispatch-seams | [executor-policy-dispatch-seams](executor-policy-dispatch-seams/) |
| group-thinking-plan-loop | [group-thinking-plan-loop](group-thinking-plan-loop/) |
| runtime-recovery | [runtime-recovery](runtime-recovery/) |
| rust-host-r1-kernel | [rust-host-r1-kernel](rust-host-r1-kernel/) |
| step-07-mvp | [step-07-mvp](step-07-mvp/) |
| step-08-standalone-coordination | [step-08-standalone-coordination](step-08-standalone-coordination/) |
| step-09-group-thinking-mvp1-mvp2 | [step-09-group-thinking-mvp1-mvp2](step-09-group-thinking-mvp1-mvp2/) |
| step-09-mvp3-to-mvp5 | [step-09-mvp3-to-mvp5](step-09-mvp3-to-mvp5/) |
| step-09-mvp6-to-mvp9 | [step-09-mvp6-to-mvp9](step-09-mvp6-to-mvp9/) |
| team-dispatch-v1 | [team-dispatch-v1](team-dispatch-v1/) |
| visibility-herdr | [visibility-herdr](visibility-herdr/) |

The current runtime owners are dispatch Assignment/Run/RunResult, Unit/CollaborationPattern and Workflow. Their current documents and the historical engine snapshots are linked from the area portal. A transcript, pane state or passing old proof does not establish current implementation authority.
```

### Complete target / successor

Path/anchor: docs/platform/agent-coordination/verification/README.md#evidence-sets
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 24ac5779753cd6be2f9beb3cfb13970695327154a94021e00c3ddc0040a59d72
Shown text SHA256: d45f468176e422e1f9f40b7ab437984a89aad32d9d6e03953c002ae89c8ae5be
Lines: 25 to 25

```text
## Evidence Sets

These are dated physical evidence collections, not proof that every tested runtime still exists or that the files were re-verified. Step 08 CoordinationSession/FlowDefinition and all three Step 09 session-protocol collections are historical engine evidence. Other collections also require their individual dates, commits and current owners: old code-panel/plan-loop proof is not proof that removed facades still ship. All payload bytes remain unchanged.

| Collection | Reading location |
|---|---|
| architecture-advisory-panel | [architecture-advisory-panel](architecture-advisory-panel/) |
| code-implementation-track-policy | [code-implementation-track-policy](code-implementation-track-policy/) |
| code-panel-multicell-facade | [code-panel-multicell-facade](code-panel-multicell-facade/) |
| confinement-authority-implementation | [confinement-authority-implementation](confinement-authority-implementation/) |
| coordination-envelope | [coordination-envelope](coordination-envelope/) |
| dispatch-operability-implementation | [dispatch-operability-implementation](dispatch-operability-implementation/) |
| executor-policy-dispatch-seams | [executor-policy-dispatch-seams](executor-policy-dispatch-seams/) |
| group-thinking-plan-loop | [group-thinking-plan-loop](group-thinking-plan-loop/) |
| runtime-recovery | [runtime-recovery](runtime-recovery/) |
| rust-host-r1-kernel | [rust-host-r1-kernel](rust-host-r1-kernel/) |
| step-07-mvp | [step-07-mvp](step-07-mvp/) |
| step-08-standalone-coordination | [step-08-standalone-coordination](step-08-standalone-coordination/) |
| step-09-group-thinking-mvp1-mvp2 | [step-09-group-thinking-mvp1-mvp2](step-09-group-thinking-mvp1-mvp2/) |
| step-09-mvp3-to-mvp5 | [step-09-mvp3-to-mvp5](step-09-mvp3-to-mvp5/) |
| step-09-mvp6-to-mvp9 | [step-09-mvp6-to-mvp9](step-09-mvp6-to-mvp9/) |
| team-dispatch-v1 | [team-dispatch-v1](team-dispatch-v1/) |
| visibility-herdr | [visibility-herdr](visibility-herdr/) |

The current runtime owners are dispatch Assignment/Run/RunResult, Unit/CollaborationPattern and Workflow. Their current documents and the historical engine snapshots are linked from the area portal. A transcript, pane state or passing old proof does not establish current implementation authority.
```

### Full diff

```diff

```

## classification-claim_75041e871c0b191949808b55f541184d

Entry kind: changed-classification-accounting
Class: Judgment
Source digest: d319970d29c29c5c781fc873bff405b6868816863f23906712c367d109b2fff8
Target digest: e6a51d5c197169a5427b3a20aab9b9c9ad0e458bc7ef25ccf8a34ae1b2713ed5

### Merge accounting

```json
{
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-registry-projection.json",
  "before": {
    "claimId": "claim_75041e871c0b191949808b55f541184d",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-recovery.json",
    "receiptCommit": "2269f2d2790f5bcef0a9ea4838cf27954619feda",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "reviewed",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-12",
    "reviewedAt": "2026-10-12",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-registry-projection.md",
    "reviewReportCommit": "dd1fe8d808aa60d559722b4c604acaff1894837c",
    "reviewMode": "ordinary",
    "reviewNote": "identity projection of plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md row claim_768ec152838b0cad32dd12fe283c78c2; bytes equal"
  },
  "after": {
    "claimId": "claim_75041e871c0b191949808b55f541184d",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-recovery.json",
    "receiptCommit": "2269f2d2790f5bcef0a9ea4838cf27954619feda",
    "authoredBy": "codex-session:27@2026-10-14",
    "reviewStatus": "pending",
    "pendingReason": "A31 current candidate text changed by upstream merge; old receipt retained as history, current successor candidate-unverified under A28."
  },
  "meaning": "Changed upstream candidate text withdraws the old classification approval; old receipt stays immutable history, current unit candidate-unverified. Review conservation only, no truth sweep."
}
```

### Complete source / predecessor

Path/anchor: docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-31
Content commit: c18020da3
Native digest: d319970d29c29c5c781fc873bff405b6868816863f23906712c367d109b2fff8
Shown text SHA256: d319970d29c29c5c781fc873bff405b6868816863f23906712c367d109b2fff8
Lines: 293 to 301

```text
- no `Work` lifecycle mutation (`pick`, `return`, `claim`, `take`): enforced by boundary grep tests (`test/runner/dispatch-reconciliation-import-graph.test.mjs`). Work driving orchestration lives exclusively in Work Driver (`src/runner/loop.mjs`, `src/runner/fanout-batch.mjs`);
- no event store append (`appendEvent`): audit dispatch logging is isolated to `src/runner/dispatch-log.mjs` outside dispatch core;
- no semantic Workflow/domain operation lookup in the strictly decoupled dispatch core. Work-layer lookups belong to `src/runner/work-compat.mjs` and `src/runner/operation-choice.mjs`; caller-derived hints enter the compiler. Historical compatibility re-exports and an `infra` manifest label are not current ownership proof. See boundary tests at `test/runner/dispatch-reconciliation-import-graph.test.mjs:434-443`.
- no semantic operation choice;
- no direct protocol/skill/domain executor launch;
- no RunResult confidence decision (owned by the Run Result Evaluator);
- no provider/model selection outside the policy resolver (item 4);
- no second private executor-launch path for a domain or coordinating harness.
  The retired `cohort-planner.mjs` is not a current exception or authority.
```

### Complete target / successor

Path/anchor: docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-31
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: e6a51d5c197169a5427b3a20aab9b9c9ad0e458bc7ef25ccf8a34ae1b2713ed5
Shown text SHA256: e6a51d5c197169a5427b3a20aab9b9c9ad0e458bc7ef25ccf8a34ae1b2713ed5
Lines: 297 to 305

```text
- no `Work` lifecycle mutation (`pick`, `return`, `claim`, `take`): enforced by boundary grep tests (`test/runner/dispatch-reconciliation-import-graph.test.mjs`). Work driving orchestration lives exclusively in Work Driver (`src/runner/loop.mjs`, `src/runner/fanout-batch.mjs`);
- no event store append (`appendEvent`): audit dispatch logging was isolated to `src/runner/dispatch-log.mjs` outside dispatch core (module removed with `dispatch log`, decision 0062; `fgos run` records provenance under `.fgos/assignments/<unitRunId>/`);
- no semantic Workflow/domain operation lookup in the strictly decoupled dispatch core. Work-layer lookups belong to `src/runner/work-compat.mjs` and `src/runner/operation-choice.mjs`; caller-derived hints enter the compiler. Historical compatibility re-exports and an `infra` manifest label are not current ownership proof. See boundary tests at `test/runner/dispatch-reconciliation-import-graph.test.mjs:434-443`.
- no semantic operation choice;
- no direct protocol/skill/domain executor launch;
- no RunResult confidence decision (owned by the Run Result Evaluator);
- no provider/model selection outside the policy resolver (item 4);
- no second private executor-launch path for a domain or coordinating harness.
  The retired `cohort-planner.mjs` is not a current exception or authority.
```

### Full diff

```diff
--- source
+++ target
@@ -1,5 +1,5 @@
 - no `Work` lifecycle mutation (`pick`, `return`, `claim`, `take`): enforced by boundary grep tests (`test/runner/dispatch-reconciliation-import-graph.test.mjs`). Work driving orchestration lives exclusively in Work Driver (`src/runner/loop.mjs`, `src/runner/fanout-batch.mjs`);
-- no event store append (`appendEvent`): audit dispatch logging is isolated to `src/runner/dispatch-log.mjs` outside dispatch core;
+- no event store append (`appendEvent`): audit dispatch logging was isolated to `src/runner/dispatch-log.mjs` outside dispatch core (module removed with `dispatch log`, decision 0062; `fgos run` records provenance under `.fgos/assignments/<unitRunId>/`);
 - no semantic Workflow/domain operation lookup in the strictly decoupled dispatch core. Work-layer lookups belong to `src/runner/work-compat.mjs` and `src/runner/operation-choice.mjs`; caller-derived hints enter the compiler. Historical compatibility re-exports and an `infra` manifest label are not current ownership proof. See boundary tests at `test/runner/dispatch-reconciliation-import-graph.test.mjs:434-443`.
 - no semantic operation choice;
 - no direct protocol/skill/domain executor launch;

```

## classification-claim_0e2474daa2e50a259dd3a37b94f26b81

Entry kind: changed-classification-accounting
Class: Judgment
Source digest: 9b4bc94938d6135650d0e946cfef0e3aa95b2251864fed7e90f59f1fbe3294a2
Target digest: 322419c0e84b881356ecb635a9d4b6c4d50589985bc96981eee26a4646ef8d65

### Merge accounting

```json
{
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-registry-projection.json",
  "before": {
    "claimId": "claim_0e2474daa2e50a259dd3a37b94f26b81",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-recovery.json",
    "receiptCommit": "2269f2d2790f5bcef0a9ea4838cf27954619feda",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "reviewed",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-12",
    "reviewedAt": "2026-10-12",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-registry-projection.md",
    "reviewReportCommit": "dd1fe8d808aa60d559722b4c604acaff1894837c",
    "reviewMode": "ordinary",
    "reviewNote": "identity projection of plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md row claim_56e1871eaa00fdf2f40b840bf9944e35; bytes equal"
  },
  "after": {
    "claimId": "claim_0e2474daa2e50a259dd3a37b94f26b81",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-recovery.json",
    "receiptCommit": "2269f2d2790f5bcef0a9ea4838cf27954619feda",
    "authoredBy": "codex-session:27@2026-10-14",
    "reviewStatus": "pending",
    "pendingReason": "A31 current candidate text changed by upstream merge; old receipt retained as history, current successor candidate-unverified under A28."
  },
  "meaning": "Changed upstream candidate text withdraws the old classification approval; old receipt stays immutable history, current unit candidate-unverified. Review conservation only, no truth sweep."
}
```

### Complete source / predecessor

Path/anchor: docs/platform/agent-coordination/architecture/dispatch-control-plane.md#source-inventory
Content commit: c18020da3
Native digest: 9b4bc94938d6135650d0e946cfef0e3aa95b2251864fed7e90f59f1fbe3294a2
Shown text SHA256: 14586fa3bf40c66a9a138311548ddc69adeb068d86ad532082a315e69afebf66
Lines: 343 to 343

```text
## Source Inventory

| Layer | Modules | Responsibilities & Boundaries |
| --- | --- | --- |
| Dispatch Core | `src/runner/dispatch/**` (`cli.mjs`, `plan.mjs`, `resolve.mjs`, `prepare.mjs`, `settlement.mjs`, `reconcile-cli-spawn.mjs`, `herdr-reconcile.mjs`, `proof-helpers.mjs`, `assignment-runner.mjs`, `confinement/**`, `transport.mjs`, `herdr-round.mjs`, `brief.mjs`, `assignment.mjs`, `runtime-inspection.mjs`) | Execution allocation, plan compilation, confinement and adapter execution. Boundary tests prohibit Work lifecycle mutation/imports; they do not prohibit every textual occurrence of `claim`. |
| Work Driver Compatibility | `src/runner/work-compat.mjs` | Work-layer capability/prompt lookup helpers; not a dispatch-core semantic owner or evidence of an `infra` manifest registration. |
| Workflow Operation Selection | `src/runner/operation-choice.mjs` | `chooseStageOperation` and `executeDriverOperationChoice` retain their historical export names while selecting current Workflow step operations and consuming hardened RunResult. |
| Work Driver | `src/runner/loop.mjs`, `src/runner/fanout-batch.mjs` | Work lifecycle orchestration and batch driving. A Run's dispatch claim is not Work intake/approval authority; no current `OccupancyPort` API is implied. |
| Audit Seam | `src/runner/dispatch-log.mjs` | Audit event logging (`logExecutorDispatch`) isolated from dispatch core. |
```

### Complete target / successor

Path/anchor: docs/platform/agent-coordination/architecture/dispatch-control-plane.md#source-inventory
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 322419c0e84b881356ecb635a9d4b6c4d50589985bc96981eee26a4646ef8d65
Shown text SHA256: eea83cfd0baab0d45425cd9ccf5c2e4b4a6d9b7f2c602c48f710faf505e6dae5
Lines: 347 to 347

```text
## Source Inventory

| Layer | Modules | Responsibilities & Boundaries |
| --- | --- | --- |
| Dispatch Core | `src/runner/dispatch/**` (`cli.mjs`, `plan.mjs`, `resolve.mjs`, `prepare.mjs`, `settlement.mjs`, `reconcile-cli-spawn.mjs`, `herdr-reconcile.mjs`, `proof-helpers.mjs`, `assignment-runner.mjs`, `confinement/**`, `transport.mjs`, `herdr-round.mjs`, `brief.mjs`, `assignment.mjs`, `runtime-inspection.mjs`) | Execution allocation, plan compilation, confinement and adapter execution. Boundary tests prohibit Work lifecycle mutation/imports; they do not prohibit every textual occurrence of `claim`. |
| Work Driver Compatibility | `src/runner/work-compat.mjs` | Work-layer capability/prompt lookup helpers; not a dispatch-core semantic owner or evidence of an `infra` manifest registration. |
| Workflow Operation Selection | `src/runner/operation-choice.mjs` | `chooseStageOperation` and `executeDriverOperationChoice` retain their historical export names while selecting current Workflow step operations and consuming hardened RunResult. |
| Work Driver | `src/runner/loop.mjs`, `src/runner/fanout-batch.mjs` | Work lifecycle orchestration and batch driving. A Run's dispatch claim is not Work intake/approval authority; no current `OccupancyPort` API is implied. |
| Audit Seam | removed (`src/runner/dispatch-log.mjs`, decision 0062) | Audit event logging (`logExecutorDispatch`) was isolated from dispatch core; `fgos run` now records provenance under `.fgos/assignments/<unitRunId>/`. |
```

### Full diff

```diff
--- source
+++ target
@@ -6,4 +6,4 @@
 | Work Driver Compatibility | `src/runner/work-compat.mjs` | Work-layer capability/prompt lookup helpers; not a dispatch-core semantic owner or evidence of an `infra` manifest registration. |
 | Workflow Operation Selection | `src/runner/operation-choice.mjs` | `chooseStageOperation` and `executeDriverOperationChoice` retain their historical export names while selecting current Workflow step operations and consuming hardened RunResult. |
 | Work Driver | `src/runner/loop.mjs`, `src/runner/fanout-batch.mjs` | Work lifecycle orchestration and batch driving. A Run's dispatch claim is not Work intake/approval authority; no current `OccupancyPort` API is implied. |
-| Audit Seam | `src/runner/dispatch-log.mjs` | Audit event logging (`logExecutorDispatch`) isolated from dispatch core. |+| Audit Seam | removed (`src/runner/dispatch-log.mjs`, decision 0062) | Audit event logging (`logExecutorDispatch`) was isolated from dispatch core; `fgos run` now records provenance under `.fgos/assignments/<unitRunId>/`. |
```

## classification-claim_b9b42545b42b04889685191ada1a3892

Entry kind: changed-classification-accounting
Class: Judgment
Source digest: 685a1962cfdf2a77e004ce63487f93f36b00b332083debf26cda969e833559fd
Target digest: 26f57ec1a1282005fa3076c63998c3fb78981b3ff51b90ebcbb2d0eca20f42a1

### Merge accounting

```json
{
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-registry-projection.json",
  "before": {
    "claimId": "claim_b9b42545b42b04889685191ada1a3892",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-recovery.json",
    "receiptCommit": "2269f2d2790f5bcef0a9ea4838cf27954619feda",
    "authoredBy": "codex-session:1@2026-10-10",
    "reviewStatus": "reviewed",
    "reviewedBy": "reviewer:claude-session:4df9e88c@2026-10-12",
    "reviewedAt": "2026-10-12",
    "reviewReport": "plans/260925-documentation-authority-unification/reports/phase-06/review-2-registry-projection.md",
    "reviewReportCommit": "dd1fe8d808aa60d559722b4c604acaff1894837c",
    "reviewMode": "ordinary",
    "reviewNote": "identity projection of plans/260925-documentation-authority-unification/reports/phase-06/review-2-truth-classifications.md row claim_59ad4dee06128bbae88ce5897658bae2; bytes equal"
  },
  "after": {
    "claimId": "claim_b9b42545b42b04889685191ada1a3892",
    "receiptPath": "plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-recovery.json",
    "receiptCommit": "2269f2d2790f5bcef0a9ea4838cf27954619feda",
    "authoredBy": "codex-session:27@2026-10-14",
    "reviewStatus": "pending",
    "pendingReason": "A31 current candidate text changed by upstream merge; old receipt retained as history, current successor candidate-unverified under A28."
  },
  "meaning": "Changed upstream candidate text withdraws the old classification approval; old receipt stays immutable history, current unit candidate-unverified. Review conservation only, no truth sweep."
}
```

### Complete source / predecessor

Path/anchor: docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-37
Content commit: c18020da3
Native digest: 685a1962cfdf2a77e004ce63487f93f36b00b332083debf26cda969e833559fd
Shown text SHA256: 685a1962cfdf2a77e004ce63487f93f36b00b332083debf26cda969e833559fd
Lines: 345 to 351

```text
| Layer | Modules | Responsibilities & Boundaries |
| --- | --- | --- |
| Dispatch Core | `src/runner/dispatch/**` (`cli.mjs`, `plan.mjs`, `resolve.mjs`, `prepare.mjs`, `settlement.mjs`, `reconcile-cli-spawn.mjs`, `herdr-reconcile.mjs`, `proof-helpers.mjs`, `assignment-runner.mjs`, `confinement/**`, `transport.mjs`, `herdr-round.mjs`, `brief.mjs`, `assignment.mjs`, `runtime-inspection.mjs`) | Execution allocation, plan compilation, confinement and adapter execution. Boundary tests prohibit Work lifecycle mutation/imports; they do not prohibit every textual occurrence of `claim`. |
| Work Driver Compatibility | `src/runner/work-compat.mjs` | Work-layer capability/prompt lookup helpers; not a dispatch-core semantic owner or evidence of an `infra` manifest registration. |
| Workflow Operation Selection | `src/runner/operation-choice.mjs` | `chooseStageOperation` and `executeDriverOperationChoice` retain their historical export names while selecting current Workflow step operations and consuming hardened RunResult. |
| Work Driver | `src/runner/loop.mjs`, `src/runner/fanout-batch.mjs` | Work lifecycle orchestration and batch driving. A Run's dispatch claim is not Work intake/approval authority; no current `OccupancyPort` API is implied. |
| Audit Seam | `src/runner/dispatch-log.mjs` | Audit event logging (`logExecutorDispatch`) isolated from dispatch core. |
```

### Complete target / successor

Path/anchor: docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-37
Content commit: b1e53b4fb0e99963328e84b63a4764c0d87abb21
Native digest: 26f57ec1a1282005fa3076c63998c3fb78981b3ff51b90ebcbb2d0eca20f42a1
Shown text SHA256: 26f57ec1a1282005fa3076c63998c3fb78981b3ff51b90ebcbb2d0eca20f42a1
Lines: 349 to 355

```text
| Layer | Modules | Responsibilities & Boundaries |
| --- | --- | --- |
| Dispatch Core | `src/runner/dispatch/**` (`cli.mjs`, `plan.mjs`, `resolve.mjs`, `prepare.mjs`, `settlement.mjs`, `reconcile-cli-spawn.mjs`, `herdr-reconcile.mjs`, `proof-helpers.mjs`, `assignment-runner.mjs`, `confinement/**`, `transport.mjs`, `herdr-round.mjs`, `brief.mjs`, `assignment.mjs`, `runtime-inspection.mjs`) | Execution allocation, plan compilation, confinement and adapter execution. Boundary tests prohibit Work lifecycle mutation/imports; they do not prohibit every textual occurrence of `claim`. |
| Work Driver Compatibility | `src/runner/work-compat.mjs` | Work-layer capability/prompt lookup helpers; not a dispatch-core semantic owner or evidence of an `infra` manifest registration. |
| Workflow Operation Selection | `src/runner/operation-choice.mjs` | `chooseStageOperation` and `executeDriverOperationChoice` retain their historical export names while selecting current Workflow step operations and consuming hardened RunResult. |
| Work Driver | `src/runner/loop.mjs`, `src/runner/fanout-batch.mjs` | Work lifecycle orchestration and batch driving. A Run's dispatch claim is not Work intake/approval authority; no current `OccupancyPort` API is implied. |
| Audit Seam | removed (`src/runner/dispatch-log.mjs`, decision 0062) | Audit event logging (`logExecutorDispatch`) was isolated from dispatch core; `fgos run` now records provenance under `.fgos/assignments/<unitRunId>/`. |
```

### Full diff

```diff
--- source
+++ target
@@ -4,4 +4,4 @@
 | Work Driver Compatibility | `src/runner/work-compat.mjs` | Work-layer capability/prompt lookup helpers; not a dispatch-core semantic owner or evidence of an `infra` manifest registration. |
 | Workflow Operation Selection | `src/runner/operation-choice.mjs` | `chooseStageOperation` and `executeDriverOperationChoice` retain their historical export names while selecting current Workflow step operations and consuming hardened RunResult. |
 | Work Driver | `src/runner/loop.mjs`, `src/runner/fanout-batch.mjs` | Work lifecycle orchestration and batch driving. A Run's dispatch claim is not Work intake/approval authority; no current `OccupancyPort` API is implied. |
-| Audit Seam | `src/runner/dispatch-log.mjs` | Audit event logging (`logExecutorDispatch`) isolated from dispatch core. |+| Audit Seam | removed (`src/runner/dispatch-log.mjs`, decision 0062) | Audit event logging (`logExecutorDispatch`) was isolated from dispatch core; `fgos run` now records provenance under `.fgos/assignments/<unitRunId>/`. |
```
