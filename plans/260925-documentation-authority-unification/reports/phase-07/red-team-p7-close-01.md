# Phase 7 closing red-team and checkpoint review (01)

Reviewer: `reviewer:sonnet-session:a7e6570ca021dab9d@2026-10-18`
Review mode: hostile red-team + checkpoint
Reviewed commit: `c2409de08` (detached, read-only worktree `/home/vantt/projects/forgentX-s8-review`). The pack names `681a86005`; `git diff --stat 681a86005 c2409de08` is one added file (`review-a38-step-09-runner-n1-01.md`), so every pack command gives the same output at both commits.
Pack read: `p7-checkpoint/pack-blind.md`, SHA-256 `29f5742dd08d3c09d4201596c9762ada679f154cd8a6cfb8ec5c8796ef172aa6` (48,807 bytes).
Not run: `fgos`, `npm test`, native sync/inventory, D/E, comparator. The answer-key directory was not opened. Only `git show`/`sed`/`jq`/`sha256sum`/`python3 -I` on committed bytes and the recorded logs.

Limit stated up front: heading-unit digests (records 01, 06, 10, 14, 16, 27) come from the production extractor and are not shell-reproducible (I tried line-only and line-range hashes). For those I verified pack = index row (claimId, anchor, digest, lines), heading text and slug, not the digest algorithm. All unheaded-block digests and all file/line digests were recomputed.

## Verdict (short)

Phase 7 should NOT go to owner review yet. Zero Critical, **2 High**, 4 Medium, 6 Low. The sensitivity pack is caught 6/6 with no false flag from my side (records 02, 03, 10, 13, 17, 26). Both High findings are record/decision gaps that are cheap to close, but they are exactly the "A46 deferral hides" and "red check called closed" cases the plan says must not reach the owner as green. Details below.

## A. Blind sensitivity pack, 30 records

Method per record: each pack claim was compared field by field with the committed source it quotes (matrix row, alignment row, index tuple, residual file, ratchet change row, routing binding), plus the pack's own commands. A record is `defect` only when a field differs from the source or the source contradicts the claim.

| # | Record | Verdict | Evidence |
|---|---|---|---|
| 01 | rebind current-1128 | clean | index row part-020: anchor `12-architecture-change-size`, digest `210c880d...`, lines 430-430, claim id equal; line 430 is `## 12. Architecture Change Size` (slug matches) |
| 02 | contract S3-07 | **defect** | pack `implementationEvidence[0]` = `agent-result-claim-contract.mjs:45`; the matrix row (`step-03-contract-boundary-matrix.json`) says `:5`, and line 5 is `export const AGENT_RESULT_CLAIM_CONTRACT = ... { id: 'agent-result-claim', version: 2 }`. Line 45 is a closing `}`. All other fields equal the matrix |
| 03 | rebind current-0281 | **defect** | pack digest `7ecbfde0b13952ce60d4c6064436ec1734b1d491c54814c38d6a16ff3f10ddcf` has `ce60d4` where the index tuple (part-007) and the recomputed `sha256(sed -n 340,341p, chomp eof)` at `e6b7efeec` both give `7ecbfde0b13952ce64d4c6064436ec1734b1d491c54814c38d6a16ff3f10ddcf` (`ce64d4`). One character changed. Anchor, lines, claim id are correct |
| 04 | alignment X-MAIN-02 | clean | statement file and 3 evidence file SHA-256 all equal; `facts.rs:206-240` `judge` returns Unknown for other host/ns; `lib.rs:40-100` WindowsJob/MacosTree always Unknown/Refused; `process-identity.mjs:122-160` same table. Pack fields equal the step-05 row |
| 05 | alignment X-STALE-03 | clean | hashes equal; `reviewed.mjs:300-309` passes `readOnly: true, independentOf:['producer'], inputs:[producerResult]`; `panel.mjs:57-120` `Promise.allSettled` over all seats before synthesis; intent doc line 421 states no sibling-isolation claim |
| 06 | rebind current-0322 | clean | index lines 106-106, anchor/digest/claim id equal; heading slug correct |
| 07 | contract S3-04 | clean | pack row is byte-identical to the matrix row; evidence spans verified (`assignment.mjs:443-444,626-628` stamp lines, `plan.mjs:56`, `assignment-runner.mjs:1570-1583`); registry row CTR013 (architecture-map:458) and `assignment-run-runresult.md:44` agree: no version field |
| 08 | routing QF-12 | clean | digest recomputed = `0218679c...`; line 207 equals content at both commits; binding equals part-036 row |
| 09 | rebind current-0973 | clean | recomputed digest equals; no heading line in 271-277 |
| 10 | rebind current-0303 | **defect** | pack `sourceAnchor` = `x-slice-live-tính-năng-xuyên-tầng-trỏ-về-component`; index tuple and native anchor = `slice-live-tính-năng-xuyên-tầng-trỏ-về-component` (heading `##### Slice — live (...)` at line 414). The spurious `x-` prefix is not a slug of the heading. Digest, lines, claim id equal |
| 11 | alignment X-STALE-02 | clean | hashes equal; `reviewed.mjs:138` `params?.maxRounds ?? cfg?.patterns?.reviewed?.maxRounds ?? 2`; intent line 419 matches |
| 12 | rebind current-0379 | clean | digest equal, lines 664-665 |
| 13 | contract S3-11 | **defect** | pack `contractId: CTR004`; matrix row says `CTR002`. Registry row 447 is `CTR002 mọi caller ↔ store` (event schema v2, one-door-write); CTR004 (row 449) is the human/system ask-answer contract. The pack row also cites `architecture-map.md:447`, which is the CTR002 row, so the row contradicts its own evidence |
| 14 | rebind current-0914 | clean | anchor `doctor` for `##### Doctor`, digest/lines/claim id equal |
| 15 | accounting ratchet-0004 | clean | `sha256(docs/specs/reading-map.md)` = `ff12350c...`; the six commit subjects exist; stat shows each of f9ea9c219, 9a5cc2df7, b9a00c589, 0e377d7b6 touches reading-map; `after` and `mainCommits` equal part-122 row byte for byte |
| 16 | rebind current-1136 | clean | anchor `3-document-map`, lines 48-48, digest equal |
| 17 | a34 X-A34-25 | **defect** | `verbatimPayload` differs from the residual text: residual file has `Dispatch nhận đầu vào đã phân giải`, pack has `nhận vào đầu đã phân giải` (first differing byte 389). The residual file SHA and the declared payload SHA `6516be6a...` are correct for the file text, so the pack text is the altered side |
| 18 | rebind current-0520 | clean | digest equal, lines 1499-1500 |
| 19 | rebind current-0359 | clean | digest equal, lines 432-438 |
| 20 | rebind current-0949 | clean | digest equal, lines 46-58 |
| 21 | rebind current-0249 | clean | digest equal, lines 95-98 |
| 22 | a34 X-A34-19 | clean | residual file SHA, payload SHA and verbatim text identical (`cmp`); source digest, target anchor `unheaded-block-134` equal the preservation row |
| 23 | routing QF-07 | clean | digest recomputed equal, line 202; binding equals part-036 row |
| 24 | routing X-DEFECT-03 | clean | digest recomputed equal, line 23 of `owner-queue.md`; route equals binding |
| 25 | alignment X-STALE-06 | clean | hashes equal; `requestRound`/`authorizeDeclaredOperation` appear nowhere in `src` or `bin`; `patterns/index.mjs:34-46` has exactly solo/reviewed/panel |
| 26 | contract S3-02 | **defect** | pack `payloadTransport` says "payload carries a `version` field validated when the step definition is loaded"; the matrix row says "current payload has no version field". Pack contradicts itself (`version: null`, "no payload version field exists today"), the registry row CTR012 (architecture-map:457), `workflow-stage-operation.md:27-29`, and code (`src/workflow/definition.mjs` has no `version`, no workflow YAML carries `version:`) |
| 27 | rebind current-0843 | clean | anchor `d-adr0037-observe-component-architecture`, lines 32-32, digest equal |
| 28 | a34 X-A34-27 | clean | file SHA, payload SHA and verbatim text identical to residual |
| 29 | rebind current-0499 | clean | digest equal, lines 1378-1390 |
| 30 | accounting ratchet-0003 | clean | `sha256(docs/specs/observe.md)` = `bf89de13...`; commit `55534d991` exists and touches only observe.md among the two files; `after`/`mainCommits` equal part-122 row |

Flagged: **02, 03, 10, 13, 17, 26** (6 of 30). Seeded-defect classes seen: wrong line cite, one-char digest, wrong anchor prefix, wrong contract id, swapped words in verbatim text, contradicted version claim. I made no flag from doubt: every flagged row has a byte-level or source-level contradiction, and the 24 clean rows were each matched against committed data.

## B. Truth sample

Population: `step-05-authority-alignment.json` (109 rows: 31 high, 78 medium; one parked row `PARK-PROTECTED-01`) and `step-03-contract-boundary-matrix.json` (22 rows, parked 0; I checked all 16 contract rows `S3-01..S3-16`, the six `X-STALE` rows are shared with step 5).

Seeded draw (mine): seed string `p7-close-red-team-2026-10-18-a7e6570c`; rank every step-05 row id by `sha256(seed + ":" + id)` ascending, take the first 10. Drawn: QF-04, X-SEM-17, X-DEFECT-01, X-DEFECT-12, QF-13, X-A34-22, X-SEM-23, X-A34-19, QF-10, QF-03.

### B1. Seeded 10 rows

| Row | Verdict | Evidence |
|---|---|---|
| QF-04 | true | plan routing table family 4: 28 semantic to Step 2, 4 projection to Step 6, alias mechanics to Phase 8; row text equals it |
| X-SEM-17 | deferred-honestly | legacy `docs/ui-spec/components/C01-item-card.md` and candidate exist; row claims meaning/owner only, not whole-file truth; group id present in `cross-area-inventory.json` |
| X-DEFECT-01 | deferred-honestly | `C1-D01` exists at `owner-queue.md:21`, rationale-only, Phase 9 under L10-37 |
| X-DEFECT-12 | deferred-honestly | `F10-11` at `owner-queue.md:34`; reading-map attribution is protected, routed to Phase 9 (`review-a38-step-06-projections-01.md:24`) |
| QF-13 | true | plan family 13 "separate main-owned item" |
| X-A34-22 | true | residual file SHA and payload SHA recomputed equal, row preserved |
| X-SEM-23 | deferred-honestly | as X-SEM-17 (modal M02) |
| X-A34-19 | true | verbatim identical to residual (same as pack record 22) |
| QF-10 | true | plan family 10 "owner-only accounting" |
| QF-03 | true | plan family 3 route equals row |

Seeded result: 10/10 not false (4 true, 3 deferred-honestly, 3 routing true). Note: the draw is dominated by routing/deferred rows because 90 of 109 rows are `deferred`; it is a weak probe of code truth, so section B2 carries the real weight.

### B2. Every high-risk and parked row, plus all S3 contract rows

| Row | Verdict | Evidence |
|---|---|---|
| X-A34-01, 17-28 (13 rows) | true | all 28 A34 preservation rows: residual file SHA and payload SHA recomputed equal for every row; `verbatimPayload` hashes to the stored SHA for all 28; source and target files exist. Deferred-honestly as preserved text |
| X-STALE-01 | true | `definition.mjs:396-433` dependsOn validation; three patterns in `patterns/index.mjs:34-46` |
| X-STALE-02 | true | see pack 11 |
| X-STALE-03 | true | see pack 05 |
| X-STALE-04 | true | `workflow/runner.mjs:411-428,614-630`, `run.mjs:632-651` bind by role |
| X-STALE-05 | true | `reviewed.mjs:251-261` producer scoped writes, `run.mjs:794-803` runner commits, checkers `readOnly: true` |
| X-STALE-06 | true | see pack 25 |
| X-CTR010-01 | true | gateway yaml header `x-contract: "CTR010 · fgos-gateway.v1"`, `gateway.rs:3`; registry CTR010 row 455 Gateway; CTR011 row 456 confinement; no candidate doc uses CTR010 for confinement |
| X-MAIN-01 | **false** | statement: "hot state/main-checkout remain next-track work". The main-checkout single door is implemented and in the close pin: `src/runner/repo-locks.mjs` exports `withMainCheckout`, used by `merge.mjs`, `claim-port.mjs`, `main-fgos-checkpoint.mjs`; `src/runner/main-checkout-lock.mjs` is deleted; commit `cd7ed1207` (2026-10-17) is an ancestor of `eab4d617b`; registry rows `main-checkout`, `merge-slot`, `worktree-admin` exist and `fences.mjs:47` lists `MAIN_DOOR_LOCKS`. Candidate `component-boundary.md:84` already says Holder-lock owns the main checkout mutex through `withMainCheckout`. Only hot state is pending. Evidence pin also stale (`lock-registry.v1.json`, statement file SHA differ from current bytes) |
| X-MAIN-02 | true | pack 04 |
| X-MAIN-03 | true | `component-boundary.md:83-84` Process (L0) and Holder-lock (L1) rows, `:102-104` routes; row pin stale (file edited later) but claim holds |
| X-LOCK-01 | true | `holder-lock/rust/Cargo.toml` depends on `fgos-process`; `predecessor.rs` ends a dead holder's recorded domain, no pid/TTL decision |
| X-LOCK-02 | true | no session-identity dependency in Cargo.toml or `src/holder-lock/*`; the only hits are comments |
| X-LOCK-03 | true | contract `internal-route-lock-fd` v1 exists; facade keeps the fd in a WeakMap (`index.mjs:70`), `LockHandle` is opaque |
| X-LOCK-04 | **false in part** | "main-checkout/hot-state are not cut over in this track": main-checkout is cut over (see X-MAIN-01); the one registry claim holds |
| X-LOCK-05 | deferred, now stale | row says the candidate distribution spec lacks lock rows; `docs/platform/packaging-distribution/spec.md:530-533` now carries 5g/7/7b (Step 9 author freeze). Evidence span `registrations.mjs:2223-2258` now shows `config-awareness`; lock registrations start near 2264; `holder-lock-checks.mjs:172-225,490-527` shifted |
| X-LOCK-06 | true | `judge` vectors file exists; Rust and Node tables agree (pack 04) |
| X-LOCK-07 | true | `lib.rs:40-100` only linux-gate implemented; others Unknown/Refused |
| S3-01 | true | `component-boundary.md:182-183` and `:775` carry "Historical/deferred" labels; no runtime producer (`patterns/index.mjs`) |
| PARK-PROTECTED-01 | true as parked | `git diff eab4d617b HEAD -- docs/specs/reading-map.md` is +10/-2: a transition banner and two `compounding`→`knowledge` edits; raw equality to main is false and no disposition is recorded (finding M3) |
| S3-02 | true | matrix correct; no version field in `definition.mjs` or workflow YAML |
| S3-03 | true | `execution-contract.mjs:47` `CONTRACT_POLICY_VERSION = '1'` |
| S3-04 | true | pack 07 |
| S3-05 | true | `assignment-runner.mjs:1563-1593` writes `assignment-run.v2` fields (dispatchPlan, phase, delivery) |
| S3-06 | true | `effective-execution-contract.mjs:25-26` id/version 1 |
| S3-07 | true | `agent-result-claim-contract.mjs:5`, `run-result.mjs:486-531` |
| S3-08 | true | `run-result.mjs:289-292` v3, v4 accepted at `:557-560`; `normalizeRunResultV4` |
| S3-09 | true in substance, **false citation** | `loop.mjs` does use `runOutcome` (line 103). But `loop.mjs:1011-1030` is now an executor-dispatch audit event (the mapping is at `:901-915`, `:1538`), and `workflow/runner.mjs:83-97,164-166` contain no confidence/satisfied logic (they build unit inputs and a gate check; the outcome gate is at `:337,:703`). The same span is in P7-DOC-GAP-01 |
| S3-10, S3-11, S3-12 | true | registry rows 446 CTR001, 447 CTR002, 448 CTR003 equal the matrix ids |
| S3-13 | true | CTR009 executor.v1; load validation at `config.mjs:394` |
| S3-14 | true | `confinement-authority.v1` appears nowhere in code (documentation-only label); `confinement-policy.v1`, `confinement-plan.v1`, `confinement-attestation.v1` are the code stamps |
| S3-15 | true | OpenAPI `info.version: 1.0.0`, `x-contract: CTR010` |
| S3-16 | true | gateway thin wrapper over verbs; component-boundary:73 |

Truth sample totals (B2, 47 rows: 32 step-05 high/parked rows with A34 counted as 13, plus S3-02..S3-16): **true 43** (A34 rows and X-LOCK-07 count as true-and-honestly-deferred, PARK-PROTECTED-01 as correctly parked), **true with a false citation 1** (S3-09), **deferred but now stale 1** (X-LOCK-05), **false 2** (X-MAIN-01, X-LOCK-04 in part). Seeded 10: 4 true, 3 deferred-honestly, 3 routing-true, 0 false.

Also run (mechanical, whole population): statement-file SHA of 26 of 109 step-05 rows and evidence SHAs of many more no longer equal the current bytes (candidate files were edited after the rows were pinned: Step 9 item 1 touched 19 files, plus the N1 header and runner citation fixes). For high rows: X-MAIN-01, X-MAIN-03, X-LOCK-03, X-LOCK-04, X-LOCK-05, S3-01, and the two X-DEFECT-06/-08 rows. The files with changed bytes were independently re-reviewed as changed units, but the alignment rows themselves were not re-verified at the final bytes (finding M1/M4).

## C. Hostile review of Phase 7 as a whole

Ranking: Critical 0, High 2, Medium 4, Low 6.

### High

**H1. `npm test` is red at the last recorded run and was not rerun at the final HEAD; no decision records accepting the red.**
- Evidence: Step 9 proof table requires `env -u CLAUDE_CODE_SESSION_ID npm test` exit 0 ("real behavior only"), and its Stop rule lists "failed real test". The only complete run is the Lead's at `879a4d5fe`: 8,654 tests / 8,504 pass / **61 fail** (`step-09-accounting-suite-attribution.json`; log `scratchpad/p7-npm-test-879a4d5fe.log`, tail `ℹ fail 61`, `exit=1`). The later worker run died before any test body (EROFS on the suite lock). Docs under `docs/platform/**` changed after `879a4d5fe` (`e6b7efeec`, `b919e2b9b`) and the suite was not rerun. A46 relaxes only strict E and the comparator; nothing relaxes `npm test`.
- The "not plan-caused" attribution is source-diff only ("byte-equal to the close main pin"): no run of the suite at `eab4d617b` or any list of the 61 failing files was produced, so pre-existing is asserted, not shown. One failure is demonstrably branch-caused: `test/runner/dead-vocabulary-guard.test.mjs` (added by main, present at `eab4d617b`) scans `docs/platform/component-boundary.md`, where the Phase 6 carriage text still contains retired names. It is recorded as P7-DOC-GAP-05 but only as a Phase 9 landing blocker, with no L11 decision that Phase 7 closes with it red.
- Fix: (a) run `npm test` once at the closing HEAD on a clean host and attach the failing-test list; (b) run the same list at main `eab4d617b` and attach, so "pre-existing" is a measured set difference; (c) record an L11 (or ask the owner) for the exact residual: the dead-vocabulary-guard failure plus any failure absent on main. Without (c), the close proof row is not met.

**H2. The A46 premise "main-import accounting" is not what the red strict-E/comparator sets are; they are the files changed since B0, mostly by Phase 7's own edits.**
- Evidence: `step-09-runner-n1-open-sets.json` lists 35 `filesUnknownBlocking`. `git diff --name-only 6f0f39ca1 HEAD -- docs/platform` returns exactly 35 files, and the two sets are identical (changed-not-unknown: none; unknown-not-changed: none). Only 6 of those 35 are touched by any non-merge main commit since B0 (component-boundary, event-store/spec, holder-lock/spec, instruction-composition, repository-runtime-layout, process/spec); the declared "post-B0 main-authored" carry is 3 files. The other 29 (for example `architecture-intent.md`, which has one changed hunk since B0 yet all 147 of its units are in `claimsUnknownBlocking`; `docs/platform/README.md`, `runner/README.md`, `ui-spec/README.md`, `architecture-map.md`, `assignment-run-runresult.md`, `workflow-stage-operation.md`) were changed only on the plan branch. The Lead's own partition file says these rows "fit neither a demonstrated existing mechanical disposition nor the post-B0 main-authored category". Phase 6 closed with strict E: 0 unknown. `progress.md` claims "exact comparison finds no additional Phase-7-own open set", but that comparison is the new set against the previously recorded set (self-referential), not an attribution to main.
- Why it matters: A46 and the plan's success criterion 4 ("no changed unit is handed to Phase 9") were decided on a description that the data does not support. The owner chose option B to stop chasing main drift; the actual remaining red is a consequence of Phase 7 changing candidate files (a one-hunk edit turns a whole file unknown), and Phase 9 will have to account it whatever main does.
- Fix: record the corrected attribution (35 files = every candidate file changed since B0; 6 main-touched, 29 plan-only; 2,436 claims, 233 gaps) in `step-09-package-blocker.json` and `owner-answers.md`, and ask the owner one question: ratify A46 on those facts, or account the 29 plan-only files here (mechanical digest-match decisions, as already done for 27 units). Do not mark Phase 7 "own work accounted" until that answer exists.

### Medium

**M1. Two "aligned" high rows are false at the close pin and the holder-lock status header is stale against code.** X-MAIN-01 and X-LOCK-04 say main-checkout is not cut over; code at `eab4d617b` shows the single door landed (`repo-locks.mjs`, `withMainCheckout`, `cd7ed1207`). `docs/platform/holder-lock/spec.md` header still says the main door and `worktree-admin` "land with the main-door track" while §1 and §14 and `component-boundary.md:84` describe them as owned and implemented; main's own copy at `eab4d617b` has the same stale header, and `Last reviewed: 2026-10-16` predates the commit. Fix: change both rows to `doc-fix`/deferred with the header refresh routed to the Phase 9 main-import step (it is main-authored text), and re-pin their evidence at the final bytes.

**M2. Mechanical checks A and I are not literally green, and some edits sit outside the Phase 7 allowlist.** Check A (first-parent non-merge commits touch only `allowed-paths.json`) at HEAD: 19 outside paths in 5 commits, including `scripts/check-legacy-docs-ratchet.exceptions.json`, `scripts/check-decision-citation-drift.baseline.json` (a baseline), phase-06 reproduction manifests, `reports/phase-06/working-identity-registry.json`, `reports/phase-06/candidate-unverified-*.json`, `ledger/retired-unit-decisions.json`, and Phase 6's `allowed-paths.json` (commit `2296413a2` widened it to admit `reports/phase-07/` and the baseline file). The recorded Check A (`step-09-author-checks.json`, head `9a5d55056`) predates these commits; the later N1 turns report scope against the assignment, not the Phase 7 allowlist. Check I records `equalToFrozenBaseline: false` with an imported delta (three main links). L11-21 authorizes only the ratchet exceptions. Fix: one L11 entry that names each lane (native registry persistence, candidate-unverified lists, citation baseline append, reproduction manifests, ratchet exceptions) as plan-owned accounting data, rerun A at the final HEAD with the extended allowlist, and state I as "red only for the imported delta".

**M3. `PARK-PROTECTED-01` has no disposition.** Raw equality of `docs/specs/reading-map.md` with the main parent is false (+10/-2). The independent review recommended "close as branch correct, divergence accepted and recorded" and a one-line Phase 9 note; the Lead record still says "remains open for formal Lead disposition". The proof row "protected-boundary: only authenticated main import may appear" cannot be called green until it is closed. Fix: record the disposition (L11) with the Phase 9 line.

**M4. Evidence pins in steps 3 and 5 are stale in ways a reader will hit.** 26 statement SHAs and many evidence SHAs differ from current bytes; concrete wrong citations: S3-09/P7-DOC-GAP-01 (`loop.mjs:1011-1030`, `workflow/runner.mjs:83-97,164-166`), X-LOCK-05 (`registrations.mjs:2223-2258`), and the CTR013 contract's own sentence at `assignment-run-runresult.md:69` citing `assignment.mjs:455-460,663-667` while the registry row cites the correct `443-444,626-628`. Fix: recompute pins and spans at the final HEAD (hash plus a one-line probe per span) before the scorecard is published.

### Low

- **L1.** `reports/phase-07/progress.md` "State" still reads "Current action: STOP / N1 author re-entry required" and "Completed steps: Steps 1 and 2", contradicting the later sections. The owner will read this block first. Fix: replace with the current close state and pointers.
- **L2.** `owner-answers.md` P7-DOC-GAP-02 and -04 still say "routed to the Step 9 closing carry"; the candidate now has the 5g/7/7b rows (`packaging-distribution/spec.md:530-533`) and Event Store ranks 58/70 (`holder-lock/spec.md:126-131`, component-boundary Event Store row). Mark resolved or narrowed.
- **L3.** Reader key candidate hashes are stale for 3 of 8 sealed files (acknowledged in `progress.md` N2 and independently confirmed by `review-a38-step-09-own-bindings-accounting-01.md`, N2-1..3). No answer, route or anchor changed in the three files, so this is disclosed and reviewed; I did not re-run the anchor checker (my slug function disagrees on 6 Vietnamese anchors, which is a tool difference, not evidence). Keep the "no fresh seal" wording in the scorecard.
- **L4.** Legacy appears as owner/target in places: all 11 `docs/specs/runner.md` plus `observe.md` and `io-contract.md` A34 rows name a legacy file as `targetOwner`, and the Gateway serves `/contract` from `docs/contracts/fgos-gateway-api-v1.yaml` (`gateway.rs:1187`) while the registry cites the candidate copy. Both are disclosed (Step 6 projection canonical source, A34 activation condition), but Phase 8/9 plan files do not name `gateway.rs:1187`. Add it to the Phase 8 consumer inventory.
- **L5.** Ratchet rows `accounting-ratchet-0003/0004` still carry `reviewedAt: 2026-10-06` and "independent changed-row review owed" after the 10-18 review (`review-a38-step-09-own-bindings-accounting-01.md` rows ok). Cosmetic, but a reader will think review is outstanding.
- **L6.** README says areas are Accepted while candidate headers say Candidate/Draft (reader finding 4, routed to Phase 9 as P7-DOC-GAP-04). Reasonable as a deferral; it is a candidate-vs-candidate inconsistency inside Phase 7's D4/D8 scope, so name it in the scorecard.

### Checked and found sound (so it is not re-opened)

- No approval is carried: every queue/row `reviewStatus` is `pending`; reviewers are distinct sessions; the three Step 9 reviews exceed the A46 deep-read minimum (199 + 164 + 94 vs 272) and found and drove real rework (R1 runner line shift, R2 `bin/fgos.mjs` lines), fixed in `b919e2b9b`.
- No candidate edit after the key seal changes a reader answer: the sealed union is 8 files, 3 changed, and the independent N2 review read each change. Round 1 failed on one reader-fabricated anchor, round 2 passed 6/6 per scenario with 0 fabricated anchors and 0 legacy-authority answers.
- CTR010-CTR013: Gateway keeps CTR010 in the candidate registry, OpenAPI, source and component-boundary; confinement is CTR011 in the candidate registry, architecture-map component/slice rows and rollout history; CTR012/CTR013 explicitly record no version field, verified against code; no candidate document uses CTR010 for confinement. Legacy `docs/architecture-map.md:328,338,372` and `docs/specs/confinement-authority.md:1353` still say CTR010 for confinement; that is the recorded Phase 9 cutover item under A45, not an inconsistency in the candidate corpus.
- The six stale coordination rows (X-STALE-01..06) match present code.

## Required before owner review

1. H1: suite at closing HEAD plus main-pin baseline plus recorded decision.
2. H2: corrected attribution recorded and owner ratification of A46 on it.
3. M1-M4 and L1-L2: record-keeping fixes, none needs code.

Status: DONE_WITH_CONCERNS
Summary: pack records flagged 02, 03, 10, 13, 17, 26 (6/6 caught, 24 clean); truth sample B1 10/10 not false (4 true, 3 deferred-honestly, 3 routing true), B2 43 true / 1 true-with-false-citation (S3-09) / 1 deferred-now-stale (X-LOCK-05) / 2 false (X-MAIN-01, X-LOCK-04 in part); findings Critical 0, High 2 (npm test red with no recorded waiver; A46 premise misattributes strict-E/comparator red to main imports when 35/35 files are those changed since B0), Medium 4, Low 6; verdict: Phase 7 cannot go to owner review until the two High findings are closed.
