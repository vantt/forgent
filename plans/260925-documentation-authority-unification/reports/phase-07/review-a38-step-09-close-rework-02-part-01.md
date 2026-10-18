# Review a38 step-09 close rework-02, part 01

Reviewer: `reviewer:sonnet-session:a36847c0ba0b93308@2026-10-19`
Reviewed commit: `7ba806025` (detached, verified by `git log --oneline -1`)
Part: `review-input-step-09-close-rework-02/part-01.json`, sha256 `d0a51c1845d3c8b768a70339b99cb43a7b412a644745c1da30710dbe3a282648` (matches the requested pin).

## Method

For all 50 entries I recomputed from committed bytes (`git show 7ba806025:<path>`): statementFileSha256, every evidence fileSha256, every span sha256 (hash of the `sed -n` span without trailing newline), that the probeLine/probe text matches the span line, and for the two directory refs (`apps/fgctl/src`, `packages/distribution`) the git tree id via `git rev-parse 7ba806025:<dir>`. Result: zero hash mismatches across 50 entries (about 65 spans). I then read cited spans for semantic support.

Scope note: X-MAIN-01, X-LOCK-04 and X-LOCK-05 are NOT in part 01 (they are in part-02.json), so they are not judged here. Part 01 holds contract rows S3-01..16 and X-STALE-01..06, and 28 alignment rows.

## Per-entry verdicts

| Entry | Verdict | Independently checked evidence |
|---|---|---|
| contract-S3-01 | ok | Hashes/spans match; agent-coordination/spec.md:24-42 says engine retired; patterns/index.mjs `runPattern` is the current entry; no Team Cognition producer claimed. |
| contract-S3-02 | ok | CTR012, version null. definition.mjs:241-253 refuses duplicate operation ids; assignment.mjs:270-280 refuses unresolved taskSpec; steps.mjs `taskSpecForStep`/`operationsForStep`. No version field invented. |
| contract-S3-03 | ok | `CONTRACT_POLICY_VERSION = '1'` at execution-contract.mjs:47; assignment.mjs:481-629 hashes match. |
| contract-S3-04 | ok | CTR013, version null. assignment.mjs:443-444,626-628 are `contractPolicyVersion`/`normalizerVersion` stamps (row says stamps do not claim a payload version: consistent); plan.mjs:56 `compileDispatchPlan`; assignment-runner.mjs:1570-1583 dispatch plan wiring. No invented version. |
| contract-S3-05 | ok | assignment-runner.mjs:1561 `contract: 'assignment-run.v2'`; spans hash-match. |
| contract-S3-06 | ok | assignment.mjs:886-915 and assignment-runner.mjs:955-965 hash-match; effective contract path persisted in the run record. |
| contract-S3-07 | ok | agent-result-claim-contract.mjs:5 is `{ id: 'agent-result-claim', version: 2 }` exactly as stated. |
| contract-S3-08 | ok | run-result.mjs 289-351,557-676 and contract doc 239-333 hash-match; failed/refused classification does not advance success. |
| contract-S3-09 | ok | loop.mjs:103 imports `runOutcome`; 901-915 compute `runOutcomeResult = runOutcome(outcome.runResult)` and stop safely when `!runOutcomeResult?.satisfied` with "Work lifecycle untouched"; loop.mjs:1538 `validateOutcome = runOutcome(...)`; workflow/runner.mjs:337 `unit.outcome !== 'pass'` and :703 `unitRunResult.outcome` against `acceptOutcomes`. Contract doc 308-333 "Work Boundary" supports lifecycle-only-through-Work-verbs. Minor: workflow/runner.mjs reads outcome fields instead of calling `runOutcome()`, which still fits the row's "runOutcome/runResult" wording. |
| contract-S3-10 | ok | architecture-map.md:446 is the CTR001 row (fgos.v1 envelope, exit taxonomy). |
| contract-S3-11 | ok | architecture-map.md:447 is CTR002 (event schema v2, one-door-write, hard-fail-unknown-version, acyclic). |
| contract-S3-12 | ok | architecture-map.md:448 is CTR003 (worker trust boundary, `fgw/` worktree, report-only channel). |
| contract-S3-13 | ok | config.mjs:394 `validateRunnerConfigShape(...)`. |
| contract-S3-14 | ok | `confinement-policy.v1`, `confinement-plan.v1`, `confinement-attestation.v1`; row correctly calls `confinement-authority.v1` a documentation-only registry label. |
| contract-S3-15 | ok | OpenAPI `x-contract: "CTR010 · fgos-gateway.v1"`, info.version 1.0.0; gateway.rs:3 names CTR010. |
| contract-S3-16 | ok | component-boundary.md:73 describes the single gateway process delegating to CLI/core; yaml 8-47 hash-match. |
| contract-X-STALE-01..06 (6 entries) | ok | Inventory-only rows with no spans; statement/evidence hashes match; no semantic claim beyond "not evaluated here". |
| alignment-X-DUP-03 | ok | Both manifests exist at the commit and differ (docs/architecture-manifest.json carries extra entries), consistent with preserving the canonical/projection distinction. |
| alignment-X-SEM-05 | ok | Target `docs/platform/agent-confinement/spec.md` exists; hashes match. |
| alignment-X-SEM-11 | ok | `docs/platform/observe/spec.md` exists; hashes match. |
| alignment-X-SEM-12 | ok | Target exists; `apps/fgctl/src` (a1417c00...) and `packages/distribution` (91994c20...) match `git rev-parse 7ba806025:<dir>`; file hashes match. |
| alignment-X-SEM-13 | ok | Hashes match; deferred whole-file binding. |
| alignment-X-SEM-14 | ok | `docs/platform/runner/spec.md` exists; hashes match. |
| alignment-X-A34-01, -14..-28 (16 entries) | ok | Whole-file deferred bindings of the five residual JSON files and their ledger decisions; every statement and evidence hash recomputed equal; no numeric span claimed; rows state they are not present implementation assertions. |
| alignment-X-NAV-01..04 (4 entries) | ok | Each statement file under system-architecture/architecture exists and is named in docs/platform/README.md (grep count 1 each). |
| alignment-X-STALE-03 | ok | reviewed.mjs:280-315 checker `runRole` with `readOnly: true`, `independentOf: ['producer']`, `inputs: [producerResult]`; panel.mjs:57-109 `Promise.allSettled` waits for every seat and the synthesizer gets all member results; run.mjs:516-538 context-ref handling. architecture-intent.md section 11 (line 421) states the same and no blanket sibling-isolation claim. |
| alignment-X-DEFECT-06 | rework | See below. |

## Totals

50 entries: 49 ok, 1 rework (X-DEFECT-06). Hash mismatches: 0. Part sha: verified.

## Rework detail

alignment-X-DEFECT-06 (statement `docs/platform/runner/architecture/h-7af1f0242611.md`, "Disposition of bounded observation TRUTH-15"): the evidence and proofCommand cite `docs/specs/runner.md:2475,2607,2895`. The hashes are correct but the lines do not support the claim. The candidate text now cites `runner.md:2477,2609` (the 0031 2x2 grid tables) and `runner.md:2897` (`### 0034`), per the 2026-10-18 row in `post-review-edits.md` (earlier review R1 fix). At 7ba806025 line 2477 holds the grid text, 2609 is "> Xếp thành lưới 2×2" and 2897 is `### 0034`. The row's pinned lines are each 2 lines early: 2475 is mid-sentence ADR 0029 prose, 2607 is "Cửa sổ ấy đã đóng. `0029` điền vào...", 2895 is the `docs/history/tsk-1m8/` bullet of the preceding ADR. A wrong citation: the row's evidence does not show the corrected citation it dispositions. Fix: pin 2477, 2609, 2897 (or cite the headings `### 0031`/`### 0034`) and recompute spanSha256 and probe text. The candidate text itself is correct; only the row evidence is stale.

Status: DONE_WITH_CONCERNS
Summary: 49 ok, 1 rework: alignment-X-DEFECT-06. X-MAIN-01, X-LOCK-04, X-LOCK-05 are in part-02, not part 01.
