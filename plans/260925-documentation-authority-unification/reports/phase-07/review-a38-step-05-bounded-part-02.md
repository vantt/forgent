# A38 review: Step 5 bounded part 02

- Reviewer: `reviewer:sonnet-session:a6e5cb71fcc35506d@2026-10-17`
- Author session: `codex-session:fgos-run_unit-run-17922161b19023@2026-10-17`
- Reviewed commit: `5334499c1075646bc05c7873868e10dbefa27106` (detached read-only worktree `/home/vantt/projects/forgentX-s8-review`)
- Pin check result: the request's light verification script ran once and printed OK. All pins and all three parts match bytes and sha256, each part has at most 60 entries and at most 400 KB, and the remainder frame ids are sorted, unique, count 22,454 and match `sortedIdsSha256`.
- Review mode: ordinary
- Scope: `review-input-step-05-01/part-02.json`, 60 entries (49 bounded-authority-alignment, 11 A34-preservation). No remainder draw and no rollup here.

## Method

Mechanical checks on all 60 entries, by script:
- Schema, unique entry ids, and `reviewerVerdict` still `pending`.
- Recomputed sha256 of `statementPath` and of every evidence `ref` (line-range suffix stripped).
- Anchor lookup in the statement file.
- A34 rows: `verbatimPayload` hash, residual file hash, decision file hash, `claimId` present in the residual and decision files, review report exists, source and target current-file hashes.

Deep reads: code and doc spans read in both directions (statement to code, code to statement).

Seed for the extra draw: Python 3.10.12 `random.Random('a38-s5-part02-sonnet-held-seed-4f1c9d').sample(pop, 6)`.
- Population: the 29 rows that no mandatory rule covers (X-NAV-01..04, X-DEFECT-01..14, PRES-X-A34-01..11).
- Draw: `X-DEFECT-08, X-DEFECT-01, PRES-X-A34-02, X-DEFECT-11, X-DEFECT-04, PRES-X-A34-08`.

Deep-read set (48 ids):
- Mandatory high-risk rows (18): X-STALE-01..06, X-CTR010-01, X-MAIN-01..03, X-LOCK-01..07, S3-01.
- Digest-mismatch rows (13): QF-01..13.
- Seeded draw (6), listed above.
- Voluntary extras (11): X-DEFECT-06, X-DEFECT-07, PRES-X-A34-01, -03..-07, -09..-11.

Mechanical only (12): X-NAV-01..04 and X-DEFECT-02, -03, -05, -09, -10, -12, -13, -14.

There are no parked rows (`parkedReason` is null on all rows).

## Verdict table

| id | verdict | note | evidence |
|---|---|---|---|
| X-NAV-01..04 | ok | mechanical | Step 7 route stays deferred. Hashes of `docs/platform/README.md` and each `system-architecture/architecture/*.md` target match. |
| X-STALE-01 | ok | deep | `architecture-intent.md` section 11 "Runtime graph shape" row matches `definition.mjs:396-433` (step `dependsOn` validation) and `patterns/index.mjs:34-46` (solo/reviewed/panel switch). |
| X-STALE-02 | ok | deep | `reviewed.mjs:137,163` have `params?.maxRounds ?? cfg?.patterns?.reviewed?.maxRounds ?? 2`. Round-result history is preserved in `reviewedHistoryOutcome`. |
| X-STALE-03 | ok | deep | `reviewed.mjs` checker payload has `readOnly:true, independentOf:['producer'], inputs:[producerResult]`. `panel.mjs` runs `Promise.allSettled` over every seat before the synthesizer. The doc makes no blanket sibling-isolation claim. |
| X-STALE-04 | ok | deep | Sequencing is in `workflow/runner.mjs` (411-428 `dependsOn`, then `runUnit`). `runPattern` is in `patterns/index.mjs`. `bind()` is called in `run.mjs`. `requestRound` and `authorizeDeclaredOperation` have no match under `src/`, `bin/` or `packages/`. |
| X-STALE-05 | ok | deep | `run.mjs:673-687` commits scoped writes through `commitUnitWork`. `reviewed.mjs:251-261` has `readOnly` only when the unit has no writes. Checkers are `readOnly:true`. |
| X-STALE-06 | ok | deep | `steps.mjs:43-85` (`taskSpecForStep`, `operationsForStep`) and `runner.mjs:614-630` (`runUnit`). The retired surface is labelled historical. |
| X-DEFECT-01 | ok | deep | `C1-D01` is present in `owner-queue.md`. L10-37 rationale-only, deferred. |
| X-DEFECT-02, -03, -05 | ok | mechanical | `C1-A01`, `C1-R01`, `C1-R05` present in `owner-queue.md`; hashes match. |
| X-DEFECT-04 | ok | deep | `C1-R03` present in `owner-queue.md`; deferred, rationale-only. |
| X-DEFECT-06 | ok | deep | `h-7af1f0242611.md:49-50` keep `runner.md:2470,2602,2890` as labelled historical citations. `git show 63fa6f152:docs/specs/runner.md` lines 2470/2602/2890 carry the 0031/0029 text the doc describes. |
| X-DEFECT-07 | ok | deep | `host-use-cases.md:41,50` link to `archive/plans/260918-host-invocation-r3-remote-peer/plan.md`, which exists. |
| X-DEFECT-08 | ok | deep | `h-51f5cd7279fd.md:456` cites `bin/fgos.mjs:4410,4498`. Line 4410 is the verb-switch `default:` whose next line (4411) throws `unknown verb`. Line 4498 is `if (!entry)`, which calls `refuseHelp(unknown verb ...)` on the next line. No `evolve` verb exists. |
| X-DEFECT-09, -10, -12, -13, -14 | ok | mechanical | `GRP-LIVE-01`, `GRP-HEAD-02`, `F10-11/12/13` present in `owner-queue.md`; Step 6 routing. |
| X-DEFECT-11 | ok | deep | `GRP-SPECS-03` present in `owner-queue.md`; Step 6. |
| X-CTR010-01 | ok | deep | `gateway.rs:1-6` cites CTR010. `fgos-gateway-api-v1.yaml:2` has `x-contract: "CTR010 · fgos-gateway.v1"`. `architecture-map.md:455` has CTR010 (live) and `:456` has CTR011 as a documentation-only label. The Step 3 matrix agrees. |
| QF-01..13 | ok (stale digest, see G1) | deep | Each row's routing text matches the same-numbered owner-queue family in `reports/phase-06/owner-queue.md` and `cross-area-inventory.json` (`owner-family-NN`, sourceId `family-N`). The row-level `statementFileSha256` is stale for `phase-07/owner-answers.md` (see G1). The inherited "12-row" wording is rationale-only and is not reopened. |
| X-MAIN-01 | ok | deep | `holder-lock/spec.md:26,30`. The registry rows `main-checkout` (rank 50) and `state` (rank 60) have `"owner":"4.3"` (next track). `port.rs`/`index.mjs` implement kernel `flock` with no PID/TTL decision. |
| X-MAIN-02 | ok | deep | `facts.rs:206-240` `judge`; `lib.rs:40-100` Domain enum with `WindowsJob` and `MacosTree` returning Unknown/Refused; `process-identity.mjs:122-160` Node leaf judge. |
| X-MAIN-03 | ok | deep | `component-boundary.md:80-84` has the Observe, Session Identity, Process L0 and Holder-lock L1 rows. The `Cargo.toml` files exist. |
| X-LOCK-01 | ok | deep | `holder-lock/rust/Cargo.toml` depends on `fgos-process`. `predecessor.rs` imports `domain_is_empty`/`domain_kill_all`. `process/spec.md:28,30,111` agree. |
| X-LOCK-02 | ok | deep | Holder-lock `Cargo.toml` deps are `fgos-process`, `serde_json`, `libc` only. `src/holder-lock/index.mjs` imports no session-identity. `session-identity/spec.md:32` says lock authority does not come from this id. |
| X-LOCK-03 | ok | deep | `route.rs` "lock-fd" route with protocol 1 check. `driver.mjs` `runLockRouteSync` passes fd in slot 3. `internal-route.lock-fd.v1.json` describes the same. `holder-lock/spec.md:44`. |
| X-LOCK-04 | ok | deep | `lock-registry.v1.json` has one row per lock (name, kind, scope, rank, v3Path, fence, owner). `registry.mjs:14-30` loads it and `lockEntry` reads rows. |
| X-LOCK-05 | **rework** | deep | The code evidence is real (`registrations.mjs:2223-2258` registers `lock-kernel-semantics`, `lock-borrow-vectors`, `lock-holders`, `lock-fences`, `lock-predecessor-kill-wait`, `state-root`, config default `lock`, fixes `lock-dirs` and `lock-fences`). But the statement's `statementPath` `docs/platform/packaging-distribution/spec.md` states none of this: no `lock-*` check, no `lockRoot`, and no row 5g (grep count 0). Rows 5g/7/7b carrying them exist only in `docs/specs/distribution.md:70-73`. The row calls the statement `aligned` against a candidate document that lacks it. See R1. |
| X-LOCK-06 | ok | deep | `process-facts.judge.v1.json` rules (no pid is unknown, `Z`/absent is dead). `facts.rs` and `process-identity.mjs` implement the same table. `process/spec.md:51-72`. |
| X-LOCK-07 | ok | deep | `deferred` is right: `lib.rs:40-100` ships only `linux-gate`. Windows and macOS are Unknown/Refused. `process/spec.md:78,86` put containment with the run supervisor. |
| S3-01 | ok | deep | `component-boundary.md:181-185` and `:774-778` carry visible historical/deferred labels. They claim no Team Cognition producer and no contract id, and point to `agent-coordination/spec.md#current-summary` (lines 24-42). Commit `2180b4e72` exists. |
| PRES-X-A34-01 | ok | deep | Residual hash `b276baca…` matches the payload. All 3 residual lines occur in the source text at the pinned source commit (`2300d6557:docs/io-contract.md`). The current file hashes match the pinned values. `legacySuccessorRehomeOwed:true`. |
| PRES-X-A34-02, -03 | ok | deep | Both bind to the one section `## Restored class definitions` in `release-boundaries.md`. The payload is present in the target and every payload line is present in the source at `83d757f4d`. Same payload hash `89b76fc4…` on both rows, as the residual names. |
| PRES-X-A34-04..06, -08..-11 | ok | deep | Each payload is present in its target (`component-protocol.md`, `compatibility-harness.md`, `release-boundaries.md`, …). Every non-wrapper payload line appears verbatim in the source blob at `83d757f4d` (0 missing lines out of 1 to 22 per row). Residual `sourceUnitDigest`, `targetOwner` and `targetAnchor` match. |
| PRES-X-A34-07 | ok | deep | The payload is two adjacent sections (lifecycle chain and contract versioning). Each is present in `component-protocol.md`. All payload lines are present in the source. |

Totals for part 02: ok = 59, rework = 1.
- Deep 48 (ok 47, rework 1).
- Mechanical 12 (ok 12).
- Digest mismatches 13 (QF-01..13), all deep-read, none substantive.

## Rework calculation

- Substantive deep-read rework numerator: 1 (X-LOCK-05).
- Denominator: 48 deep reads, or 37 if only mandatory plus seeded rows are counted.
- Rate: 2.1% (2.7% on the narrower denominator), at or under the 3% threshold. No full deep read is required for this part.
- The mechanical-only rows plus the 13 QF stale-digest rows are not defects of substance (L10-37 rationale and binding wording).

## Rework items

R1. X-LOCK-05. Fix one of:
- (a) Re-point `statementPath` and anchor to `docs/platform/holder-lock/spec.md` `## 13. Setup, doctor and activation`, where the claim is actually written, and add `src/setup/holder-lock-checks.mjs` and the fgctl activation gate as evidence for the "activation validation gates release readiness" clause (not shown by the cited code).
- (b) Keep `docs/platform/packaging-distribution/spec.md` as the statement file, but set `alignment` to `doc-fix` or `deferred` (Step 9 carry). Name the gap: row 7 says it lists every registered check and row 7b every fix, yet the candidate file has no `lock-kernel-semantics`, `lock-borrow-vectors`, `lock-holders`, `lock-fences`, `lock-predecessor-kill-wait`, `state-root` and no `lock-dirs` fix. Row 5g (lock directories and the `lock` config key) is also absent. All of these exist in `docs/specs/distribution.md:70,72,73`.

I did not repair anything. The authority label is the substantive defect.

## Gaps and stops by row

| id | gap | risk | owner |
|---|---|---|---|
| G1 QF-01..13 | `statementFileSha256` (`2ffde3b3…`) is the pre-edit hash of `phase-07/owner-answers.md`. Lead edit L11-16 (commit `5334499c1`, 21 added lines) changed the file to `c8891911…`. Part-02 pins still verify, so this is a stale row field, not a content defect. Also, the family routing text lives in `owner-queue.md`/`cross-area-inventory.json`, not in `owner-answers.md`; `owner-answers.md` is only the cited statement file. | low | Lead: rebind QF rows to `c8891911…` (or state the edit is out of row scope) |
| G2 X-LOCK-05 / packaging doc | The candidate `packaging-distribution/spec.md` is missing the lock rows 5g/7/7b that `docs/specs/distribution.md` carries (documentation gap, unchanged from the Step 9 carry; not repaired here). | medium | packaging-distribution owner, Step 9 / Phase 9 |
| G3 PRES-X-A34-02..11 | `declaredResidualPayloadSha256` is null on ten rows and `payloadHashVerified:true` is the author's own recomputation of the target section text, not a hash recorded in the residual file. The residual `remainder` is a pointer sentence, not the payload. Substance was verified against source and target here. | low | Step 9 rebind |
| G4 PRES-X-A34-02..11 | `reviewReport` on the rows (`review-step10-changed-01-4d363…` or similar) differs from the report named inside the residual record (`review-3-rework-source.md`). Both files exist. | low | Step 9 rebind |
| G5 X-LOCK-07 | `deferred` by design (Windows/macOS domain kinds and containment belong to the run supervisor). Not a broken guarantee. | low | run supervisor owner |

No parked rows. No stop condition was reached for this part.

Status: DONE_WITH_CONCERNS
Summary: part-02 totals are ok 59, rework 1 (X-LOCK-05: the claimed statement is not in the cited candidate packaging-distribution/spec.md; the lock rows exist only in docs/specs/distribution.md). Rework rate 1/48 deep reads (2.1%, under 3%), so no full read is needed. All pins verify, all A34 payloads are verbatim against source and target, and all high-risk code seams are verified. Stale digests on QF-01..13 (G1) come from Lead edit L11-16 and are not a content defect.
