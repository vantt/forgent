# Step 10 checkpoint review: whole corpus

Reviewer: reviewer:claude-session:a4954387@2026-10-17
Author session: population rows name 42 authoring sessions plus the script identity (listed under Method); the population header names `codex-session:unit-run-1792169760182-e3acba42@2026-10-16`, the request names producer `codex-session:unit-run-1792176628519-ac852ba4@2026-10-17`
Pack commit: 31a716731640253022b1d3ab9aa6fbe981a45a8c
Pack id: 87641f795c349b5692f8ed527d359c74036e22af782d4fd9c5f645319c754aa1
Seed score: 4575164d6da488a2c32db8bc2a4a68c4337d883d0e112e831250437cf8a34a43

Scope: [review-request-step10-checkpoint.md](review-request-step10-checkpoint.md). Worktree HEAD `e52831e36daf883afb3c9d7dcd3fe479302c44f6` (the request commit), content pin `38672e7f157788cbe1b2bf59511bd61046dce660`; `git diff --stat 38672e7f1 HEAD -- docs scripts` is empty and the worktree was clean before and after every run. Population: [checkpoint-10-source-population.json](checkpoint-10-source-population.json), SHA256 `eba7f5fa4ff78dc9078d44642b874b7000171d7f8fe8f6361cb5eed937a4d71d` (matches the request): 22,759 active bindings from 1,045 sources, 22,757 reviewed (13,313 producer-labelled script-proven, 9,444 manual) and 2,235 scoped identity gaps.

**Excluded:** the 2 pending rows `claim_f0b2a4079764d68b1102ddddb08776ce` and `claim_127225b8542c701295574b1b00749594` (both `docs/backlog.md`, `regenerate-from-source`). A separate ordinary review covers them. This report does not close them.

**Not done here:** A28 current-truth sampling and the final red-team. Other reviewers run them in parallel.

Verdicts: 22,757 reviewed rows, 9,444 of them manual. Conservation result: 0 rework, 0 hold. No row is flipped by this report.

## Independence statement (A38)

This session is a fresh-context subagent started by the Lead session, with its own brief and no conversation history. It authored none of the population rows. Every row author is a `codex-session:*` Doer or the `script:` identity. Its typed identity prefix `claude-session:a4954387` is the same one carried by 5,805 earlier ordinary approvals in the population. Under owner answer A38 (items 1–3), a Lead-started fresh-context reviewer, red-team, block-sample or checkpoint subagent counts as an independent session for all of Phase 6, including the reviewer-held sensitivity pack. R5-1 and R6-1 are closed by A38. The seed tool accepted this identity, because `independentReviewer` checks it against every row author.

## Method

All scripts, seeds and compact raw outputs are in [sensitivity-10-checkpoint/evidence/](sensitivity-10-checkpoint/evidence/). Everything ran read-only against the worktree with `env -u CLAUDE_CODE_SESSION_ID` and `GIT_OPTIONAL_LOCKS=0`. Every write went to `/tmp/fgos-work/ckpt10-*` scratch. Heavy steps ran one at a time with `--max-old-space-size=4096 --max-semi-space-size=16`. The steps were the native inventory, pack build, global D/E, checkpoint export and the extra D. No `fgos` CLI ran and no Git write was made. `.fgos/secrets.local.env` was not read.

1. **Native inventory.** I materialized the portable helpers from [step10-package-reproduction.json](step10-package-reproduction.json), unchanged, under `evidence/producer-portable/`. `inventory-readonly.mjs` then called the unchanged `generateInventory` at the pin with the committed `working-identity-registry.json`. It produced 4,486 files and 91,388 units in 12m00s (peak RSS 7.2 GB). The registry stayed unchanged, SHA256 `b20238af95f89cd3a83fbc20dd53ce8df1192153415cd85b9586d53884aa9c2b`. No carry-forward or persistence ran.
2. **Composite pack.** `evidence/pack-gen.mjs` called the unchanged exported `buildReviewPack` once for each of the 75 decision shards that hold a manual population row. It kept every control whose claim is a reviewed manual row. In total 8,771 of 9,444 manual rows are verified sensitivity controls, with 0 shard errors and 0 digest mismatches against the population file. The other 673 rows are:
   - 420 rows with no target by disposition: reclassify 145, retain-as-evidence 198, archive 65 and regenerate 12;
   - 253 targeted rows without a recorded `targetAncestry` (older row shape), which the unchanged control filter requires.

   The full composite is 148 MB, SHA256 `301b7d04…15ad`, and too large to commit. `evidence/pack-subset.mjs` therefore keeps a seeded 1,000-control subset (seed `s10-subset-a4954387-9a4a25b09484118c`, sha256 rank), which is the committed `pack.json` (17.4 MB, 606 seed-eligible byte-equal controls). I chose the subset before the key existed, and the tool's 32-byte secret nonce selects the mutations, so the subset choice cannot steer them. No row was edited.
3. **Sensitivity**, before any reading of real rows: see the next section.
4. **Every manual row.** `evidence/row-reader.mjs` rendered all 9,444 manual rows. For each row it checked:
   - the source and target unit exist at the pin with the recorded digests;
   - the population row equals its committed shard row on the binding fields;
   - the review report exists at its commit and names the claim;
   - author and reviewer differ;
   - the normalized residual (link destinations, heading depth and trailing whitespace removed).

   The mechanical result was **0 findings in all 9,444 rows** (220 distinct committed review reports). Three further passes narrowed the residuals:
   - `residual2.mjs` compares against the target's enclosing section;
   - `residual3.mjs` reflows text and searches the whole target file;
   - `residual4.mjs` attributes absent lines of a heading section to sibling source units that have their own rows.

   `added-lines.mjs` lists target lines found nowhere in the source file. `supersede-view.mjs` renders every remaining supersede row with its absent source text next to its target section. I read every row whose residual stayed non-trivial (see Batch evidence).
5. **Exact spot check, 10% recompute, stratified blocks, D/E and the checkpoint aggregate:** see the sections below.

Authoring sessions in the population (rows): `script:propose-doc-decisions` (13,313), `codex-session:1@2026-10-09` (1,988), `codex-session:unit-run-1792034226117-40d90d09@2026-10-15` (1,487), `codex-session:1@2026-10-10` (992), `codex-session:37@2026-10-15` (775), `…a245b0a6@2026-10-15` (456), `…68b4a62c@2026-10-15` (435), `codex-session:1@2026-10-08` (380), `codex-session:8@2026-10-13` (380), `…56132651@2026-10-16` (378), `codex-session:1@2026-10-11` (286), `codex-session:21@2026-10-14` (251), `codex-session:20@2026-10-14` (232), `…e4fd15ef@2026-10-16` (223), `…f28af963@2026-10-16` (197), `…ac5d331e@2026-10-15` (182), `…89ae42db@2026-10-16` (132), `codex-session:22@2026-10-14` (93), `…eb65d2cd@2026-10-15` (75), `codex-session:17@2026-10-14` (72), `…b4112a2f@2026-10-15` (70), `codex-session:18@2026-10-14` (63), `…860e8753@2026-10-15` (48), `…e0c35701@2026-10-16` (41), `…a8237dd4@2026-10-15` (38), `…42ac8e36@2026-10-15` (30), `…cb278bf5@2026-10-15` (30), `codex-session:27@2026-10-14` (18), `codex-session:30@2026-10-15` (17), `…4191f728@2026-10-16` (13), `codex-session:39@2026-10-15` (11), `…150279f8@2026-10-16` (9), `…6f1c5957@2026-10-15` (8), `…61c43e58@2026-10-15` (8), `…eef9a749@2026-10-16` (5), `codex-session:25@2026-10-14` (5), `…41fe2051@2026-10-15` (5), `codex-session:10@2026-10-14` (3), `…9b5bd055@2026-10-15` (2), `codex-session:26@2026-10-14` (2), `codex-session:34@2026-10-15` (2), `codex-session:12@2026-10-14` (1), `…fc3c5695@2026-10-15` (1). The `…` prefix is `codex-session:unit-run-<id>`.

## Sensitivity (seeded pack)

- Command (CLI unchanged): `node scripts/propose-doc-decisions.mjs --seed-pack pack.json --seed s10-checkpoint-a4954387-70727b4fbf41d974494fb35b35784491 --reviewer reviewer:claude-session:a4954387@2026-10-17 --key <private seed-key.json> --out seed-pack.md`.
- Answering: I answered the 30 shown rows from the Markdown only, without opening the key, in [seed-verdicts.md](sensitivity-10-checkpoint/seed-verdicts.md). Six rows showed a diff, and I marked each `rework` with the specific defect:
  - a deleted reference item;
  - a date changed 2026→2027;
  - a dropped InvocationService clause;
  - an added "MUST waive every permission check" sentence;
  - a removed negation;
  - `false`→`required`.
- Scoring: `--score-pack seed-key.json --verdicts seed-verdicts.md` gave **6 of 6 mutations caught, 0 of 24 false flags, pass** (thresholds: at least 5/6 and at most 2/24). See [score.json](sensitivity-10-checkpoint/score.json). Pack id `87641f79…` equals the sha256 of `JSON.stringify(pack.json)`.
- Limitation, unchanged from Steps 3 and 6: the pack shows a unified diff and controls show "No text difference.", so this measures diff attention rather than semantic judgment.

## Exact spot check (script-proven exact rows)

- Population: all 13,313 producer-labelled script-proven rows: 12,878 mirror `delete-as-duplicate` and 435 Unit-exact `promote`.
- Draw: 100 distinct rows. Seed `s10-spot-a4954387-` + the value in `evidence/spot-seed.txt`, ranked by sha256(seed:exact:claimId). The IDs are in `evidence/spot-checks.json` `exact.ids`. The strata follow the population (94 mirror, 6 Unit-exact). No shortfall.
- Checks per row:
  - source and target digests recomputed from `git show <pin>:<path>` with the extractor's published formula (block, heading, and sha256 of the whole blob for non-Markdown `file-block` units);
  - anchors checked with `node scripts/list-doc-anchors.mjs --check` for Markdown, and `git cat-file -e` plus anchor `file-block` for others;
  - full unit and section text equal, ancestry equal, and author and reviewer are the script pair;
  - mirrors: identical source and target blob IDs, the rationale names that blob, the same anchor, and the target named once;
  - Unit-exact: `classifyExactCarry` re-proof is Unit-exact at the bound anchor, the source is at least 40 characters, and the target is single-owner or in the identical-unit exceptions.
- **Defects: 0 of 100.** The first run reported 2 false defects on `.json` and `.log` mirrors because my own recompute treated them as Markdown. I fixed the checker (the file-block rule is above) and reran, and both rows then pass. No row data changed.

## 10% independent recompute

- 100 of 100 exact-draw rows were independently recomputed (above).
- Seeded population draw: 2,276 of 22,757 reviewed rows (ceil 10%), salt `recompute`. Strata: mirror 1,302, move 635, supersede 170, promote 92, archive 36, reclassify 19, retain 16, partial 4, merge 2. Both digests were recomputed from blob lines and compared with the extractor, the population and the shard, and both anchors were checked. **Defects: 0 of 2,276.**
- Extension: the mechanical recompute over all 22,757 reviewed rows (no anchor CLI) also found 0 defects.

## Stratified candidate-block draw

- Seed: `s10-blocks-a4954387-` + the value in `evidence/block-seed.txt`. Script: `evidence/block-draw.mjs`. Full texts are in `evidence/block-draw.txt` and `block-draw.json`.
- Population: non-heading units of at least 40 characters in all 1,102 candidate owners named by a population binding, 15,050 units in all. 1,357 are named by no decision (unnamed). 274 are named and their own text differs from the source (rewritten). No stratum is short.

| # | Stratum | Block | Verdict | Note |
|---|---|---|---|---|
| 1 | unnamed | docs/platform/ui-spec/contracts/20-domain-rules.md#unheaded-block-2 | labelled | candidate header metadata block (Design status Candidate, Canonical No) |
| 2 | unnamed | docs/platform/agent-coordination/history/retired-engine/legacy/intent-preservation-ledger.md#unheaded-block-1 | labelled | history header; "Added in candidate: Historical framing only" |
| 3 | unnamed | docs/platform/agent-coordination/vision.md#unheaded-block-16 | authorized-edit | A19 correction inside `#2-planning-currently-over-materializes-work`, whose source blocks are superseded by reviewed rows claim_7f7c89a0/claim_8e62a5bc; candidate-unverified list |
| 4 | unnamed | docs/platform/agent-coordination/architecture/executor-health-and-fallback.md#unheaded-block-19 | authorized-edit | code-cited correction inside `#5-effectguaranteeport`, superseded by reviewed claim_c89663c8/claim_82896bdf |
| 5 | unnamed | docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md#unheaded-block-1 | labelled | history header with Added in candidate label |
| 6 | unnamed | docs/platform/agent-coordination/history/retired-engine/files/playbooks/mvp6-dogfood-handoff.md#unheaded-block-1 | labelled | history header with Added in candidate label |
| 7 | unnamed | docs/platform/agent-coordination/history/retired-engine/files/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-1 | labelled | history header with Added in candidate label |
| 8 | unnamed | docs/platform/packaging-distribution/contracts/setup-doctor-registry.md#unheaded-block-10 | preexisting | native platform text from f053de033 (before B0 dbe5c4328); no label; candidate-unverified |
| 9 | unnamed | docs/platform/agent-coordination/vocabulary/concept-relationships.md#unheaded-block-1 | labelled | candidate header; "Added in candidate: Liveness evidence…" |
| 10 | unnamed | docs/platform/agent-coordination/history/retired-engine/files/architecture/runtime-model.md#unheaded-block-1 | labelled | history header with Added in candidate label |
| 11 | unnamed | docs/platform/host-invocation-routing/roadmap.md#unheaded-block-13 | authorized-edit | Step 3 carriage; f1e84afba changed only the route count 73→75 under its labelled "Added in candidate — checked route snapshot" note; candidate-unverified |
| 12 | unnamed | docs/platform/packaging-distribution/spec.md#unheaded-block-36 | preexisting | one-line native intro from 3f673ae9e (before B0); candidate-unverified |
| 13 | unnamed | docs/platform/agent-coordination/decisions/ADR-002-stage-operation-compatibility.md#unheaded-block-1 | labelled | candidate header with Added in candidate label |
| 14 | unnamed | docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md#unheaded-block-2 | structural | pointer to the complete historical snapshot; no product claim |
| 15 | unnamed | docs/platform/agent-coordination/playbooks/architecture-advisory-role-doctrine.md#unheaded-block-12 | authorized-edit | registered-output mapping written in the A20 correction 96a13ab21; no Added label; reviewed candidate-unverified entry claim_901145cb |
| 16 | unnamed | docs/platform/agent-coordination/history/retired-engine/files/decisions/ADR-004-reserve-job.md#unheaded-block-1 | labelled | history header with Added in candidate label |
| 17 | unnamed | docs/platform/agent-coordination/history/retired-engine/files/contracts/coordination-session.md#unheaded-block-3 | structural | literal snapshot fence of the prior candidate file (its header carries Added in candidate) |
| 18 | unnamed | docs/platform/proposals/knowledge-registry-redesign.md#unheaded-block-3 | structural | "Source relationship: original source" navigation line |
| 19 | unnamed | docs/platform/agent-coordination/playbooks/architecture-advisory-artifact-templates.md#unheaded-block-65 | authorized-edit | f4bc8027f correction inside `#12-dialogue-response`, superseded by reviewed claim_fb0f85ad/claim_234cfe4e/claim_9d058e29 |
| 20 | unnamed | docs/platform/work-state/architecture/implementation-pointers.md#unheaded-block-1 | structural | candidate header metadata block |
| 21 | rewritten | docs/platform/host-invocation-routing/contracts/component-protocol.md#unheaded-block-57 | sourced | source lines verbatim inside a ```` md fence (claim_a1c1085c) |
| 22 | rewritten | docs/platform/documentation/history/templates/subcomponent-readme.md#unheaded-block-7 | sourced | all lines sourced (claim_67666efa, archive) |
| 23 | rewritten | docs/platform/herdr-web-dashboard/spec.md#unheaded-block-9 | authorized-edit | A40 gateway start/stop/port correction (claim_5877600a, supersede) |
| 24 | rewritten | docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#unheaded-block-10 | labelled | "Added in candidate: superseded migration bookkeeping" (claim_fd246fe0) |
| 25 | rewritten | docs/platform/host-invocation-routing/architecture/release-boundaries.md#unheaded-block-14 | sourced | verbatim inside a md fence (claim_d9084082) |
| 26 | rewritten | docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md#unheaded-block-66 | sourced | all lines sourced (claim_9abc9022) |
| 27 | rewritten | docs/platform/proposals/coordination-capability-envelope.md#unheaded-block-5 | sourced | all lines sourced (claim_85e9b5ff) |
| 28 | rewritten | docs/platform/observe/spec.md#unheaded-block-13 | sourced | all lines sourced (claim_41988cae) |
| 29 | rewritten | docs/platform/herdr-web-dashboard/spec.md#unheaded-block-26 | authorized-edit | A40 dead-link correction to the docs/knowledge layout path (claim_dc3d0ae9) |
| 30 | rewritten | docs/platform/documentation/history/templates/spec.md#unheaded-block-6 | sourced | verbatim inside a text fence (claim_a4525704) |
| 31 | rewritten | docs/platform/governance.md#unheaded-block-42 | sourced | link turned into a code path; navigation only (claim_9c4d8826) |
| 32 | rewritten | docs/platform/host-invocation-routing/contracts/component-protocol.md#unheaded-block-62 | sourced | verbatim inside a md fence (claim_49ffb586) |
| 33 | rewritten | docs/platform/work-state/spec.md#unheaded-block-65 | authorized-edit | A37 add-verb correction (claim_320ba622, supersede) |
| 34 | rewritten | docs/platform/host-invocation-routing/contracts/component-protocol.md#unheaded-block-35 | sourced | verbatim inside a md fence (claim_8c44796a) |
| 35 | rewritten | docs/platform/host-invocation-routing/contracts/component-protocol.md#unheaded-block-11 | sourced | verbatim inside a md fence (claim_e365a92a) |
| 36 | rewritten | docs/platform/proposals/architecture-advisory-panel.md#unheaded-block-7 | sourced | verbatim inside a markdown fence (claim_ff302d4f) |
| 37 | rewritten | docs/platform/runner/operations/h-51f5cd7279fd.md#unheaded-block-16 | authorized-edit | A41 live-tee correction (claim_344b9a10, supersede) |
| 38 | rewritten | docs/platform/documentation/switchboard.md#unheaded-block-6 | sourced | all lines sourced (claim_be508003) |
| 39 | rewritten | docs/platform/documentation/history/templates/contract.md#unheaded-block-4 | sourced | all lines sourced (claim_04555e50) |
| 40 | rewritten | docs/platform/runner/operations/h-51f5cd7279fd.md#unheaded-block-29 | authorized-edit | A41 deleted entropy-module correction (claim_31cf7725, supersede) |
| 41 | random | docs/platform/agent-coordination/verification/confinement-authority-implementation/P05.md#unheaded-block-4 | sourced | mirror (claim_bfe6178c) |
| 42 | random | docs/platform/agent-coordination/verification/step-09-mvp6-to-mvp9/P10-KERNEL-FIX.md#unheaded-block-55 | sourced | mirror (claim_8e2281da) |
| 43 | random | docs/platform/work-state/decisions/retired-decision-history.md#unheaded-block-93 | sourced | promote, all lines sourced (claim_331e9d0a) |
| 44 | random | docs/platform/packaging-distribution/contracts/release-manifest.md#unheaded-block-12 | sourced | move, all lines sourced (claim_f7b23e10) |
| 45 | random | docs/platform/agent-coordination/verification/architecture-advisory-panel/proofs/P05.2/clear/run-v2-02.log#file-block | sourced | mirror file-block (claim_44b6d5eb) |
| 46 | random | docs/platform/documentation/architecture/documentation-system-design.md#unheaded-block-7 | sourced | move, all lines sourced (claim_488f21ec) |
| 47 | random | docs/platform/agent-coordination/verification/step-09-mvp6-to-mvp9/P10.10.md#unheaded-block-46 | sourced | mirror (claim_4771c7a2) |
| 48 | random | docs/platform/host-invocation-routing/roadmap.md#unheaded-block-108 | sourced | move, all lines sourced (claim_76de093f) |
| 49 | random | docs/platform/agent-coordination/verification/step-08-standalone-coordination/proofs/P07.2/r6-external-adoption/evidence-export/assignments/asgn_p072_r6_external_adoption_mdview_op_005/runs/01/dispatch-plan.json#file-block | sourced | mirror file-block (claim_2cffc913) |
| 50 | random | docs/platform/agent-coordination/verification/architecture-advisory-panel/index.md#unheaded-block-9 | sourced | mirror (claim_a128630a) |

| Stratum | sourced | labelled | structural | preexisting | authorized edit | invented |
|---|---|---|---|---|---|---|
| unnamed (20) | 0 | 8 | 4 | 2 | 6 | 0 |
| rewritten (20) | 13 | 1 | 0 | 0 | 6 | 0 |
| random (10) | 10 | 0 | 0 | 0 | 0 | 0 |

**Invented-claim defects: 0 of 50** (the stop line is 2).

Under a strict reading, two unnamed "authorized edit" blocks are unlabelled. Block 15 (role-doctrine) is a Phase 6 A20 correction carried only by a reviewed candidate-unverified entry. Block 11 (roadmap) carries its count change under a label on a neighbouring line. The two "preexisting" blocks are native text from before B0. All four rely on the A28 item 2 candidate-unverified route, the same reading as the Step 6 checkpoint.

## D/E reproduction

Runs used the unchanged exported `checkInventory` on the in-memory native inventory and the persisted registry at the pin, through the committed `verify-global.mjs`. Raw summary: `evidence/de-summary.json`; the extra run is in `evidence/d-reports-registry.json`.

| Run | Prior registries | D fatal | Open (identical in every run) |
|---|---|---|---|
| both | step10-global-prior-checkpoint-registry + phase-02 | 0 | partial-carry 28, not-reviewed 2, identical-owner groups 362, reverse candidate units 2,336 |
| identity | step10-global-prior-checkpoint-registry | 0 | same |
| phase02 | reports/phase-02-identity-registry.json | 0 | same |
| extra | reports/identity-registry.json (the phase-file prior name) | 0 | same |
| extra | reports/identity-registry.json + phase-02 | 0 | same |

- Timings: 98.0 s, 94.5 s, 103.5 s, 95.6 s and 97.7 s.
- Each D run's open data and fatal findings equal the producer's `step10-package-D-summary.json` byte for byte.
- **Strict E** covers 1,045 sources, 22,759 claims and 2,235 gaps in 167.6 s. Its only fatal types are the four expected open categories: 28 partial, 2 not-reviewed (exactly the two excluded backlog rows), 362 groups and 2,336 reverse. That means 0 unknown-blocking and 0 apply findings, and the independent overlay conservation equals E (asserted in the helper). E's fatal findings, open data and explicit open findings are byte-equal to the producer's `step10-package-E.json`. The scope list equals `step10-package-source-scope.json`.
- **Committed comparator:** `node scripts/compare-doc-global-closure.mjs --gate E --actual applied-rows --expected expected.json` (expected built by the committed `expected.py`) exited 0 with `ok=true`, `errors: []` (**zero differences**) and `strictGreen=false`. The counts equal the request. `strictGreen=false` reflects the declared open categories; it is not a hidden difference.
- The same run reproduced:
  - T9 17/17 with 0 findings and the dropped-001 stub present;
  - the snapshot dry run at 68,463 rows, verify true, SHA256 `96ab3948…4820` (equals the request);
  - the population: equal to the committed file in every field except `authorSession` (see Concerns).
- Cheap checks at HEAD: `check-doc-constitution.mjs --no-ledger --promotion` gives 160/160 complete, 0 headerless and 0 missing fields. `check-doc-candidate-status.mjs --strict` gives 609 files, 217 checked and 0 findings.
- **Checkpoint aggregate.** The committed `checkpoint-export.mjs` produced 123 parts, 2,558,697,813 bytes, aggregate `4d00146ebab1b783c01425088be06b8fa75d81d18a9c55178082983b49891775`. An independent `cat <parts in manifest order> | sha256sum` (chunked, not one Node call) gives the same digest. The committed `validate-artifact.py` passed (19 top-level fields, 91,388 claims, 4,486 files, active tuple equality true). All 123 part hashes equal the producer's `step10-package-checkpoint-transport-validation.json`. **The request's aggregate SHA256 is confirmed.**
- Not repeated: native carry-forward, registry persistence and the rehearsal (not required here).

## Batch evidence and closure judgment

Residual reading of the 9,444 manual rows:

| Class | Rows | Treatment |
|---|---|---|
| bytes-equal or normalized-equal | 5,670 | mechanical only |
| all source lines present in the target section after section, reflow and whole-file passes | 8,299 of 9,024 targeted | mechanical |
| move rows to `#literal-snapshot` history carriers | 2,171 | the only added line is the `## Literal Snapshot` heading; trivial |
| absent lines all owned by sibling source rows (archived migration notices, moved or superseded child blocks) | 263 | sibling dispositions verified reviewed |
| **own-absent lines, human-read** | **409**: supersede 316, promote 84, defer 6, move 2, merge 1 | read in full (below) |
| partial-carry | 13 | A34 remainder text and residual SHA256 present; the comparator matches all 28 partials |
| novel added lines outside snapshots | 242 | read; all are candidate headers, labelled corrections, heading translations or supersede successor text |
| no target by disposition (reclassify 145, retain 198, archive 65, regenerate 12) | 420 | checked mechanically and read by pattern group against L10-3, A39, the frozen maps and the migration-notice rule; not each rationale individually |

Findings from the human read:

- **Supersede (316):** every row replaces retired-engine, stale or corrected text with a code-cited current successor in the same subject section. These are A19/A20/A35/A37/A40/A41 corrections, F6, or A31 upstream re-carries. The pre-rework originals stay byte-for-byte in the agent-coordination history literal snapshots, or in the unchanged legacy sources for runner, work-state and specs. I found no obligation silently dropped.
- **Promote (84):** Vietnamese→English heading titles and renumbering, each declared in its rationale, plus one dead-link rewrite.
- **Move (2):** a broken link label kept with an "Added in candidate" note.
- **Defer (6):** the dropped-001 dev-source units, owned by Plan C, with the stub present.
- **Merge (1):** a duplicate ADR 0002 title.
- **Move rows with additions (2, activation-binding):** labelled dated status notes declared in their rationales.

| Criterion | Evidence | Judgment |
|---|---|---|
| Every legacy source row decided and reviewed by another identity | 22,757 reviewed, 2 pending (excluded); 0 self-review; 220 committed reports resolve | Met apart from the 2 pending rows |
| Every judgment row read | 9,444 script-read; 409 own-absent plus 242 added-line rows human-read; 0 mechanical findings | Met (A36 checkpoint rule: 100%) |
| Sensitivity at least 5/6 and at most 2/24 | 6/6, 0/24 | Met |
| Exact spot check, 0 errors | 0/100 (94 mirror, 6 Unit-exact) | Met |
| 10% recompute | 2,276/22,757 and 100/100, 0 defects; full sweep 0 | Met |
| Stratified blocks, fewer than 2 invented | 0/50 | Met, with the candidate-unverified reading of 4 blocks |
| D 0 fatal against each prior; strict E and comparator | All 5 D runs 0 fatal; E equals the producer; comparator `ok=true` with 0 differences | Met |
| Checkpoint aggregate | 4d00146e… reproduced and chunk-hashed | Met; but see the durable-file concern |
| A28 truth sample and red-team, 0 open Critical/High | Run by other reviewers | Not assessed here |
| Rework, second round at most 3% | 0 rework in this checkpoint | Met |
| Component boundary | No ownership change found in the rows read | `No component-boundary change` |

**Verdict: accept.**

The conservation checkpoint passes every frozen requirement I was asked to run: sensitivity, the full judgment read, exact draw and recompute, stratified blocks, D/E, the comparator and the aggregate. Closing Step 10 still needs:

- an ordinary approval for the 2 pending backlog rows;
- A28 truth sampling and the final red-team (0 open Critical/High);
- either a Lead commit of the third-refresh durable manifest and checkpoint-registry copy, or a correction of the request text (Concern 1).

## Acknowledged residuals (not decided here)

- **Expected strict-E open categories:** 28 A34 partial carries (cutover obligations), 362 identical-owner groups, 2,336 candidate-unverified reverse units, and the 2 pending backlog decisions.
- **Owner-queue and promotion-truth items:**
  - A34 and current-truth queues;
  - 20 wording, citation and successor notes;
  - frozen author-time "Pending independent … review; no approval carry" tails kept on now-reviewed rows (L10-28);
  - 32 Phase 7/8 groups;
  - 14 runner-cutover bindings;
  - inbound and non-doc consumer queues;
  - 66 historical witness limits;
  - the unreported owner token total.
- **Candidate-unverified blocks** (unlabelled pre-B0 native text and the A20 correction block 15) remain a promotion-review concern under A28 item 3(b).
- **Not authorized here:** no promotion, retirement, cutover, sealing or owner decision. Phase 6 stays open until a separate close turn.

## Files Lead must commit (in order)

1. **Before this report:** the pack folder `reports/phase-06/sensitivity-10-checkpoint/`. It holds `pack.json`, `seed-pack.md`, `seed-pack.md.json`, `seed-verdicts.md`, `score.json`, `seed.txt` and `evidence/`, which contains:
   - the scripts;
   - `producer-portable/` helpers;
   - seeds;
   - `pack-composition.json`, `pack-subset.log`, `de-summary.json`, `d-reports-registry.json`, `spot-checks.json`, `block-draw.json`, `block-draw.txt`, `rows-summary.json`, `residual4.json`, `added-lines.json`, `transport.json`, `comparator.json`;
   - T9, snapshot, D and E summaries;
   - run logs and `large-output-sha256.txt`.

   Do **not** include `seed-key.json`.
2. **This report:** `reports/phase-06/review-10-checkpoint.md`.
3. **After the report commit:** move `seed-key.json`, delivered separately, to `reports/phase-06/sensitivity-10-checkpoint/seed-key.json`.

"Pack commit" stays `31a716731640253022b1d3ab9aa6fbe981a45a8c` until the Lead commits the pack. It is the pin the key binds to (`key.commit` = `38672e7f1…`), recorded by the tool. It is not the later storage commit.

## Concerns

1. **Medium: durable checkpoint files are stale at the request commit.** The committed `reports/doc-inventory.json` manifest still describes the previous refresh: 122 parts, 2,537,573,604 bytes, aggregate `2d58e5c6…`. The committed checkpoint registry copy `reports/identity-registry.json` is `6fcd58e6…`, not the sole persistence `b20238af…`. The request and `step10-package-checkpoint-refresh.json` claim the 123-part `4d00146e…` refresh with "registry bytes reused". I reproduced `4d00146e…` independently, so the content claim is true. But the durable manifest and registry copy were not updated in `e52831e36`. Fix: commit the refreshed manifest, Markdown and registry copy, or state explicitly that they are intentionally not refreshed. D against `reports/identity-registry.json` is still 0 fatal.
2. **Low: population header identity.** The committed population's `authorSession` is `…e3acba42@2026-10-16`. The current `verify-global.mjs` stamps `…ac852ba4@2026-10-17`. Every other field is byte-equal, so the file was not regenerated by this package run.
3. **Low: committed pack is a subset.** The pack is a seeded 1,000-control subset of the 8,771-control composite, because of repository size. The full composite is reproducible with `pack-gen.mjs`, SHA256 `301b7d04…15ad`.
4. **Low: D prior naming.** The producer's "identity" D run uses `step10-global-prior-checkpoint-registry.json`, not `reports/identity-registry.json` as the phase file and brief name it. I ran both; both are 0 fatal.
5. **Low: limited coverage in places.** Sensitivity measures diff attention. The 420 no-target rationales were read by pattern group, not individually. The exact draw has only 6 Unit-exact rows (proportional to the population).
