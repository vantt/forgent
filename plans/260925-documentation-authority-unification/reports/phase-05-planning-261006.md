# Phase 5 planning evidence and owner questions (2026-10-06)

Plan only; Phase 5 is not authorized and nothing was run beyond read-only measurement. Executable steps: [phase-05 file](../phase-05-dual-pilot-re-audit-plus-unmigrated-mixed-area.md).

## 1. Method of measurement

- Inventory regenerated into scratch (not the tree) at branch head `0aac55e4e` (inventory commit `bc153eb95`, identical in-scope tree): `node scripts/generate-doc-inventory.mjs --refresh --commit HEAD --identity-registry <scratch copy> --json-out <scratch> --md-out <scratch>`; 17 s. 4,311 files, 86,086 claim rows, 818 duplicate groups, 151 semantic-conflict groups.
- All counts by node scripts over the loaded inventory (`loadShardedJsonArtifact`); no `grep | wc`. Area membership by path (`docs/specs/<x>.md`, `docs/architect/<x>/`, `docs/platform/<x>/`, root `docs/*.md`).
- Churn: `git log main --since='30 days ago' --numstat` per path set (main is at `13d1c096b`, already contained in the branch). Commit counts are the union over the set.
- Gate baseline: `node scripts/check-doc-inventory-gates.mjs --inventory <scratch> --identity-registry <scratch>` exit 0; open data 1,383 files and 39,584 rows unknown-blocking, 86,086 rows not reviewed, 83,751 without own rationale, 20 registry gaps without disposition, 1 dropped claim unreviewed.
- Added-file behaviour measured on a throwaway clone under scratch (removed afterwards): adding one candidate document under `docs/platform/work-state/` and running the same generator command carried the registry forward in one command (4,311 to 4,312 documents, 86,086 to 86,092 units), gates stayed exit 0, the new file classified as "Platform documentation (unmapped candidate)", `candidate`, `unknown-blocking`.

## 2. Candidate sets

| Set | Files | Claim rows | KB | Headings | Unheaded blocks | Unknown-blocking rows | Consumer edges | Dup / semantic groups | Commits 30 d (since 09-22) | Last edit | Lines +/- 30 d | Decision refs |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|---|---|---:|
| **A1 host-invocation-routing** (legacy + target) | 39 | 921 | 316 | 320 | 601 | 845 | 801 | 0 / 1 | 23 (2) | 2026-10-04 | +4425/-2174 (+16/-15 since 09-22) | 0 |
| A2 packaging-distribution (legacy + target + `distribution.md`) | 29 | 1,066 | 296 | 282 | 784 | 943 | 1,136 | 0 / 1 | 94 (37) | 2026-10-06 | +4010/-486 | 16 |
| X agent-coordination (legacy + target) | 1,882 | 33,905 | 36,019 | 9,039 | 23,734 | 31,875 | 8,333 | 816 / 138 | 135 (23) | 2026-10-04 | not measured | 27 |
| **B1 work-state + io-contract** | 2 | 366 | 328 | 128 | 238 | 366 | 717 | 0 / 0 | 8 (7) | 2026-10-04 | +54/-26 | 83 |
| B2 confinement-authority | 1 | 191 | 80 | 48 | 143 | 191 | 296 | 0 / 0 | 9 (3) | 2026-10-05 | +1452/-72 (+80/-8 since 09-22) | 1 |
| B3 herdr-web-dashboard + cockpit runbook | 2 | 62 | 24 | 26 | 36 | 62 | 361 | 0 / 0 | 2 (1) | 2026-10-04 | +10/-10 | 6 |
| B4 runner + routing-handoff-contract | 2 | 488 | 452 | 163 | 325 | 488 | 1,433 | 0 / 0 | 95 (64) | 2026-10-06 | +635/-175 | 108 |

Other single-file areas for reference (claims, 30-day commits on main): `docs/specs/distribution.md` 31 rows / 50 commits (Plan A writes it), `docs/specs/reading-map.md` 3 / 21, `docs/specs/observe.md` 25 / 10, `docs/specs/fgos-plugin.md` 45 / 0, `docs/specs/distillery.md` 21 / 0, `docs/specs/decision-citation-drift.md` 20 / 0, `docs/specs/system-overview.md` 50 / 1 (Plan B adds pointer lines), `docs/architect/component-boundary` 3 files / 269 rows / 4 (already the candidate "Whole-system architecture" route with `docs/platform/component-boundary.md`).

### 2.1 Pilot A: host-invocation-routing

Selected as in the plan. Evidence: promoted portal, 6 legacy sources (431 rows, 129 headings, 302 unheaded blocks) against 33 platform targets (490 rows, 191 headings); targets average about 10 rows per file while legacy sources average 72, so a coverage gap is plausible (`rust-cli-and-proof-components-plan.md` has 113 rows and 47 headings); churn since 09-22 is 2 commits and 31 lines; the old audit method is a file-level coverage matrix with prose summaries (`verification/source-preservation-audit.md`), so it is a real comparison point; the old audit claims "No settled source detail was intentionally dropped". Alternative A2 (packaging-distribution) is rejected as the main pilot: 94 commits in 30 days and Plan C writes it. It is still used as the **known-answer control**: `docs/architect/packaging-distribution/runtime-identity-and-activation.md` lines 73 and 895-920 are the confirmed dropped-001; the blind procedure must flag them without being told.

### 2.2 Pilot B: why B1 (recommended)

B1 is the only candidate with all three required components:

- spec with decision history: `docs/specs/work-state.md` (2,321 lines): the retired-decisions section holds 165 of 325 rows; data dictionary 90 rows and behaviors 52 rows by start line (counted from the ledger's source locations);
- contracts: `docs/io-contract.md` 41 rows (31 inferred as `contract`; the generator's inferred `claimKind` for `work-state.md` is 289 `specification`, 31 `contract`, 5 `decision`, which is wrong for the decision history and is exactly what the pilot corrects);
- a root authority: `io-contract.md` (switchboard `retained-cli-io-contract`, legacy-current).

Stability: 8 commits in 30 days but +54/-26 lines across 2,515 lines; the six `work-state.md` edits are one-line or terminology sweeps (largest: `07bd0c594`, +34/-9, the Work record `workflowStep` change on 2026-10-02). No plan in the main checkout lists it as a file to write (`261006-1415-fgos-convention-component` only reads `io-contract.md`; the terminology sweep `261001-0327-request-to-run-p5` is done). No duplicate and no semantic-conflict group. Cost: 328 KB and 366 rows is the largest of the viable options, but it is 1.1% of the 33,905 rows of agent-coordination and 0.4% of the corpus; and the pilot's cost figure is an input to Phase 6.

Rejected alternatives (trade-offs):

| Option | For | Against |
|---|---|---|
| B2 confinement-authority | 191 rows; threat model, contracts, proposal decisions (section 12) in one spec | no root authority, no retired-decision section; active plan `261003-0706-confinement-credential-hygiene-and-pane-safety`; last edited 2026-10-05; 3 commits since 09-22 |
| B3 herdr-web-dashboard + operator-runbook-herdr-cockpit | calmest numbers (2 commits); cheapest (62 rows) | the `261004-1534-fgos-gateway-boundary-split` plan is reshaping this area; too small and too uniform to falsify mixed-claim handling; only a runbook, not a root contract |
| B4 runner + routing-handoff-contract | richest (488 rows, 108 decision refs, a root contract) | 95 commits (64 since 09-22), last edit today; fails the stability criterion outright |

Excluded by the plan: packaging-distribution, agent-coordination. Excluded by evidence: `docs/specs/distribution.md` (Plan A writes it, 50 commits), `reading-map`, `observe` (10 commits, new), `system-overview` (Plan B edits).

Scope note: `docs/work-item-lifecycle-vision.md` (25 rows, non-authority) is listed as a retained source of the work-state switchboard row but is also routed to the existing candidate "Platform vision and work lifecycle" (`docs/platform/vision.md`). Recommendation: leave it out of Pilot B to avoid two candidate owners for one source.

## 3. Method defect found while planning (drives step 1)

`scripts/generate-doc-inventory.mjs` derives every ledger row from the switchboard classification (lines 1090-1130: `targetOwner` only when the file proposes promote or merge; `claimKind` inferred; `reviewStatus` `blocking` or `pending`). No input exists for reviewed row decisions, and `reviewed` is `reserved` in the vocabulary. The registry carries dispositions only for retired rows (Phase 4 decision G4). So none of the fields the phase must fill (targetOwner, targetAnchor, claimKind, reviewStatus, rationale) has a place to live, and the conservation checker cannot be exercised on a decision. Step 1 adds the smallest channel (decisions shards plus scoped strict checks) to the gates script only.

Also verified: a candidate document is `unknown-blocking` by rule (`proposeDisposition`: `candidate` returns `unknown-blocking`), so adding Pilot B targets raises the global open data by their row count; the gate for the pilot has to be scoped to source rows, not global.

## 4. Questions for the owner (bundle)

1. **Pilot B selection.** Options: (a) work-state spec plus `io-contract.md`, excluding `work-item-lifecycle-vision.md`; (b) confinement-authority alone; (c) herdr dashboard plus cockpit runbook. Recommendation: (a). It is the plan's initial candidate, the only option with decision history, contracts and a root authority together, has no pending writer, and its churn is 80 lines in 30 days. (b) and (c) are being reshaped by active plans.
2. **Authorize a small gate-script change in Phase 5 (step 1b).** The channel for reviewed ledger decisions does not exist (section 3). Options: (a) add `--decisions` and `--scope` to `check-doc-inventory-gates.mjs`, test first, generator untouched, default behaviour byte-identical, independent code review; (b) no repo change, pilots use a scratch checker (the real gate is never exercised; best verdict is PASS-WITH-AMENDMENTS and Phase 6 still needs the channel); (c) extend the generator itself (larger blast radius: identity registry binding, inventory freshness). Recommendation: (a).
3. **Exit thresholds.** Confirm or change the measurable bars in the phase file's Success Criteria: control detected 100%; structural mutations 10 of 10; semantic mutations at least 5 of 6 with at most 2 false flags in 24; Pilot B rows reviewed 100% by fresh reviewers (sampling is only simulated, to size Phase 6); aliases 12 of 12 plus at least 18 of 20 history references; fresh readers at least 5 of 6 per scenario with no fabricated anchor; METHOD-MUST-CHANGE triggers (E1 failure, E2 or E3 still failing after one fix, a needed change to an existing frozen rule, unrepresentable outcome, unlabelled additions above 3%). Recommendation: accept as written; they are set so that a passing result cannot be produced by output volume alone.
4. **What Pilot A does with a confirmed drop in a promoted target.** Options: (a) register it in `dropped-claims-register.json` as open and do not touch the promoted target in Phase 5; restoration is decided per entry before Phase 9 (the dropped-001 precedent); (b) also restore the prose in the promoted target now. Recommendation: (a). The promoted portals are current authority under the one-owner rule; editing them is a separate reviewed content change, and Phase 5 is meant to show the method finds drops, not to repair them.
5. **Switchboard edit.** Not a decision the constitution leaves open (candidate status is read only from the switchboard), listed for visibility: step 4 adds one candidate scoped route `docs/platform/work-state/**` to the existing "Work state / work lifecycle engine" area in `transitional-switchboard.json` and `docs/transitional-switchboard.md`; the area stays `legacy-current`, canonical route unchanged. Say so if you do not want an operative file touched by a pilot; the fallback label would then be the generator's "unmapped candidate" routing gap.

Not asked, decided in the plan: doers, review method and harness (owner decisions of 2026-10-06); candidate location (`docs/platform/work-state/` by the constitution's placement rules); registry refresh at two checkpoints (about 12 MB compressed each, as Phase 4 did); vocabulary `reserved` to `in-use` updates as an additive 2.x amendment; fresh readers as two in-process Sonnet readers (the plan's allowed alternative to the `research-fan-out` preset).

## 5. Risks specific to the pilot

See the Risk Assessment table in the phase file. The five that matter most: candidate prose mistaken for authority (detected by a repository-wide `rg` and the candidate-status check); source drift on `work-state.md` during the phase (digest pins at every step start and at close); same-model blind spots (known-answer control and seeded mutations instead of opinion); in-process readers not sandboxed (opened-file list, anchor-existence script, clean `git status`; isolation stated as UNPROVEN); and a "quick fix" of a frozen rule (any change to an existing rule is a stop-and-ask trigger).

## 6. Unresolved

- Effort and wall time of steps 2, 5 and 6 are not estimated; step 12 records them (E11).
- Whether the carry-forward pairs candidate-document units cleanly after the real, larger candidate set is UNPROVEN beyond the one-file probe; step 6's refresh checks that no claim id is lost.
- The `claimKind` inference for the decision-history section is known wrong; how many rows change kind is a pilot output, not an estimate.
