# Phase 6 planning evidence, estimate and owner questions (2026-10-07)

Plan text only. Phase 6 is not authorized; nothing was run beyond read-only measurement and scratch inventory generation. Executable steps: [phase 6 file](../phase-06-transform-all-platform-areas-as-candidate-material.md).

## 1. Method of measurement

- Branch head `39630b398`, main `7e36897c0` (fully merged: `git merge-base HEAD main` equals main, 0 main commits ahead). Ratchet clean (995 legacy files, 24 accounted edits, 1 accounted new file).
- Inventory regenerated into scratch outside the tree: `node scripts/generate-doc-inventory.mjs --refresh --commit HEAD --identity-registry <scratch copy> --json-out <scratch>/doc-inventory.json --md-out <scratch>/doc-inventory.md` (exit 0, 17.4 s, max RSS 2.3 GB, 4,318 files, 87,153 claim rows, 118,043 consumer edges, 818 duplicate groups, 151 semantic-conflict groups). Gate command against it: `node scripts/check-doc-inventory-gates.mjs --inventory <scratch>/doc-inventory.json --identity-registry <scratch>/identity-registry.json` exit 0 (open data: 40,024 unknown-blocking rows, 87,153 not reviewed, 84,816 without own rationale, 35 registry gaps without disposition, 17 dropped claims unreviewed).
- Retirement dry run on the same scratch inventory (`check-doc-retirement.mjs --cutover`): 15 blocked, 4 pass, 1 owed to review.
- All counts by node scripts over the loaded inventory (`loadShardedJsonArtifact`) and `git ls-files`; no `grep | wc`. Scope of "legacy rows": claim rows of files in the platform-authority corpus with authority `legacy-current` or `unclassified` outside `docs/platform/` (1,040 files, 22,426 rows).
- "Exact" row: the unit digest (`sourceUnitDigest`, text only) also exists in the counterpart document: for `docs/architect/<x>` the file `docs/platform/<x>`; for the work-state pilot any `docs/platform` unit. A digest match is a byte-identical unit, so the carry is provable by a script; it is not a semantic judgment.
- Churn: `git log main --since=2026-09-06 --format=%H -- <paths>` (commits touching the set, path-simplified), and the same with `--since=2026-09-23` (last 14 days). Written as 30 d / 14 d.
- Pending writers: `status:` of every `plans/26*/plan.md` and the `docs/specs|architect|io-contract` paths its files name (main checkout and worktree hold the same plan set).
- Scratch scripts live in `/tmp/claude-1000/-home-vantt-projects-forgentX/4df9e88c-dcc7-4ca8-b24a-b69b112e7ced/scratchpad/p6/` (not in the tree).

## 2. Findings that shape the plan

1. **Agent coordination is 75% of the rows and 7% of the judgment.** 17,034 of 22,426 legacy rows. 12,882 rows are 867 evidence payload files byte-identical to their platform copy (302 Markdown, 565 other); 3,758 more rows are byte-identical units inside 70 differing Markdown pairs. Only 394 rows (two legacy-only documents with 190 rows, about 200 rows of link and header differences in about 40 files) need a decision. Evidence for the mirror: relocation policy section 2.1 (867 of 867 identical blobs) and the counterpart-digest count above (16,640 of 17,034 rows exact).
2. **Script-provable carries are 16,640 rows (74%); judgment rows are 5,420 (24%) plus 366 rows already decided by Pilot B.** 5,552 minus 132 Pilot B judgment rows already reviewed = 5,420 open. Without a script channel for exact carries every one of the 16,640 rows becomes a hand-written, hand-reviewed decision row (about 0.7 KB of JSON each, about 12 MB of shards, measured on `pilot/decisions/b-behaviors.json`: 39.2 KB for 52 rows).
3. **The 818 duplicate groups and 151 semantic-conflict groups are almost entirely evidence mirrors and name collisions, not conflicts.** Duplicates: 816 are agent-coordination evidence (804 pairs, 8 groups of 4, 2 of 6, 1 of 8, 1 of 78 spanning legacy, platform and history copies), 2 are history. Conflicts: 138 groups sit wholly under `verification/<collection>/**` (same file name in different proof run directories; the legacy and platform sides come in mirrored pairs), 12 are under `docs/history/**`, 1 is `verification/implementation-alignment.md` of host-invocation-routing against packaging-distribution. The retirement check already excludes 814 mirror duplicates ("resolve by deduplication") but has no way to record the resolution of any semantic-conflict group: all 151 stay open by construction (`check-doc-retirement.mjs` line 175, `semanticConflictGroups.length`).
4. **The cutover gates count rows outside the migration corpus.** Of 87,153 rows: history 32,495, user knowledge 10,506, consumer project 2,758, candidates 18,497 (unknown-blocking by rule, "a candidate is never a source"), legacy 22,426. `--strict` and the retirement `claims-reviewed` check count all of them; the constitution (section 7) defines the retirement gate for "a legacy source". A decision on scope is needed or the global strict run cannot reach exit 0 (owner question Q2c).
5. **The promoted areas are only partly promoted.** Switchboard: only the three area README portals are `promoted`; the other 940-odd `docs/platform` files are candidates. So restoring dropped text and adding promotion headers edits candidate files plus, at most, the three portals.
6. **Churn is concentrated.** `docs/specs/runner.md` 96 / 61 commits (30 d / 14 d), `docs/specs/distribution.md` 57 / 34, `docs/specs/reading-map.md` 24 / 9, `AGENTS.md` 11 / 8, `docs/specs/observe.md` 10 / 10, `docs/specs/confinement-authority.md` 9 / 3. Everything under `docs/architect/` except agent-coordination and packaging-distribution is nearly still (proposals 6 commits, last 2026-09-29).
7. **Pilot A first-round shards are orphaned** by the label and short-block extractor changes (they no longer load, `pilot/first-round/README.md`); the 431 host-invocation rows must be decided again under current ids. The 128 units that Pilot A never compared (merge, promote, split, archive, delete) and the 12 non-real-drop D1 groups are covered by that re-decision, not by an extra pass.
8. **The promotion gap is 110 canonical documents** (50 headerless, 60 with missing fields; `check-doc-constitution.mjs --no-ledger --promotion`), almost all agent-coordination. New candidate documents written in Phase 6 will add to it unless authored with the full header.
9. **Retirement check roots are `docs/specs/` and `docs/architect/` only** (`LEGACY_ROOTS`, `scripts/check-doc-retirement.mjs:44`), so `docs/io-contract.md`, `docs/platform-foundations.md`, `docs/routing-handoff-contract.md`, `docs/architecture-map.md`, `docs/coexistence.md` and `docs/decisions/` are invisible to its consumer-rewrite and alias-coverage checks (Phase 5 defect M-11 residue).
10. **Eight document types are still unmapped** (constitution section 2.1): Migration plan (2 files), Architecture design (1), Governance (`docs/doc-governance.md`), Governance guide (`migration-authoring-rules.md`), Transitional switchboard, Documentation portal (`docs/README.md`), User docs portal, an unfilled `<type>` placeholder. Their rows have no valid target kind until an owner decision.

## 3. Area inventory (regenerated inventory)

Batch letters are the plan's own grouping (non-overlapping file ownership). Rows are legacy rows. UB = inventory rows with disposition `unknown-blocking` (the rest are proposed `merge`, pending). Exact = script-provable carry. Judgment = rows needing a decision. Inbound = consumer edges from outside history (`archive/`, `plans/`, `docs/history/`, `.fgos/`, `CHANGELOG.md`) and outside the legacy roots. "Candidate exists" is the state at HEAD.

| Batch | Area and sources | Files | Rows | UB | Exact | Judgment | Dup / SC groups | Inbound edges (code, shipped, platform docs, other docs) | Main churn 30 d / 14 d | Pending writers | Candidate exists |
|---|---|---:|---:|---:|---:|---:|---|---|---|---|---|
| B1a | agent-coordination evidence payloads `docs/architect/agent-coordination/verification/<collection>/**` | 867 | 12,882 | 11,057 | 12,882 | 0 | 816 / 138 | 1,486 (890, 0, 576, 20) | 111 / 0 | none | yes, byte-identical mirror under `docs/platform/agent-coordination/verification/` |
| B1b | agent-coordination docs (architecture 14, decisions 12, playbooks 9, roadmap 9, proposals 6, contracts 5, vocabulary 4, history 4, root 5, verification README) | 70 | 4,152 | 3,964 | 3,758 | 394 | 0 / 0 | 625 (100, 15, 499, 11) | 154 / 20 (whole `docs/architect/agent-coordination`) | none | yes, 68 platform documents (50 headerless) |
| B2 | host-invocation-routing, 6 sources | 6 | 431 | 383 | 0 | 431 | 0 / 1 | 185 (6, 0, 173, 6) | 5 / 0 | Plan B reads two target files (not a writer, UNPROVEN) | yes, 33 targets; Pilot A re-audit exists; 16 registered drops |
| B3 | packaging-distribution, 8 sources + `docs/specs/distribution.md` | 9 | 402 | 319 | 0 | 402 | 0 / 1 | 244 (40, 3, 139, 62) | 64 / 34 | Plan B (distribution.md line 70), Plan C draft (`packaging-distribution/**`, distribution.md row 7, AGENTS.md); dropped-001 | yes, 20 targets |
| B4 | root authorities, laws, work-state close (work-state 325 and io-contract 41 decided in Pilot B; AGENTS 74, CLAUDE 30, doc-governance 75, platform-foundations 68, reading-map 23 plus 3, README 11, routing-handoff 19, coexistence 25, operator-runbook 18, switchboard 13, templates 158, user 5, contracts 1, 2 json) | 28 | 891 | 891 | 234 | 657 (132 already reviewed; 525 open, +84 rows of 3 non-authority root documents) | 0 / 0 | 1,745 (345, 73, 507, 820) | 128 / 65 | Plan B (reading-map pointer lines), Plans A done, C draft (reading-map), advisory plan (reading-map) | partly: work-state 6 candidates, `platform-foundations.md`, `vision.md` |
| B5 | whole-system architecture: component-boundary 3, `architecture-map.md`, `system-overview.md`, architect singles 7 (intent, workspace-topology x3, roadmap, system-vision, README) | 12 | 826 | 826 | 0 | 826 | 0 / 0 | 285 (46, 3, 163, 73) | 10 / 4 | Plan B (system-overview line, component-boundary row) | partly: `component-boundary.md` 20 rows, `architecture-map.md` 19 rows |
| B6 | proposals 14, redesign and discussion singles 5, domainization 1 | 20 | 1,815 | 1,815 | 0 | 1,815 | 0 / 0 | 188 (70, 6, 89, 23) | 9 / 2 | none | no |
| B7 | specs singles (confinement-authority 191, fgos-plugin 45, herdr-web-dashboard 44, observe 25, distillery 21, decision-citation-drift 20) and `docs/ui-spec/**` (21 files, 211 rows) | 27 | 557 | 557 | 0 | 557 | 0 / 0 | 280 (70, 18, 87, 105) | 20 / 14 (observe 10 / 10) | none open (the plans that wrote them are completed) | no |
| B8 | `docs/specs/runner.md` (457 KB, 157 headings) | 1 | 470 | 470 | 0 | 470 | 0 / 0 | 344 (151, 30, 69, 94) | 96 / 61 | advisory-capability plan (runner.md phase 02/03, pending), council-parity plan (runner.md, pending), request-to-run p1 (partial) | no |
| Cross | history duplicates and conflicts | n/a | n/a | n/a | n/a | n/a | 2 / 12 | n/a | n/a | n/a | n/a |
| Total | | 1,040 | 22,426 | 20,282 | 16,874 (16,640 open + 234 Pilot B) | 5,552 (5,420 open + 132 done) | 818 / 151 | 5,382 | | | |

Inbound edges to the legacy sources from immutable history and from the legacy roots themselves are not in the column (about 13,500 of the 18,828 edges in the grouping used, measured by the same script): they resolve by the alias table (Phase 4 contract), not by rewrite. Outside the batches: non-authority platform-corpus files with rows that still need a disposition (`docs/distribution-vision.md` 22, `docs/id-systems-audit.md` 32, `docs/work-item-lifecycle-vision.md` 25, `docs/backlog.md` 5 generated, `docs/specs/platform-foundations.md` 97 already non-blocking, `docs/platform/proposals/documentation-system-unification.md` 198) are carried by B4.

### 3.1 Pending writers (read in `plans/26*/plan.md`)

| Plan | Status | Writes that touch Phase 6 sources | Effect |
|---|---|---|---|
| A single-door mechanisms | completed | `AGENTS.md`, `docs/specs/distribution.md`, `docs/specs/reading-map.md`: already in the branch (main merged) | none pending |
| B convention component | pending | new `docs/platform/convention/spec.md` (a new platform area authored directly on main), pointer lines in `docs/specs/reading-map.md` and `docs/specs/system-overview.md`, a row in `docs/platform/component-boundary.md`, `docs/specs/distribution.md` line 70, `AGENTS.md` phase 06 | B3, B4, B5 re-pin; the new area enters the inventory at the next sync as a candidate with no legacy source |
| C fgctl dev activation | draft, unscheduled | `docs/platform/packaging-distribution/**`, `docs/specs/distribution.md` row 7, `docs/specs/reading-map.md`, `AGENTS.md` | not a dependency; if scheduled mid-B3, pause B3 and re-sync |
| advisory capability completion | pending | `docs/specs/runner.md` (phases 02, 03), `docs/specs/reading-map.md` | B8 pin; sync before B8 |
| council parity first slice | pending | `docs/specs/runner.md` (one mention; read or write UNPROVEN) | B8 pin |
| request-to-run p1 | partial | `docs/specs/runner.md`, `docs/architect/agent-coordination/architecture/dispatch-control-plane.md` | B1b, B8 pin |

## 4. Batching and order

Rules: one writer per target document and per decisions shard; non-overlapping source and target ownership per batch; at most 4 doers in flight; the Lead is the only committer; one generator run at a time (2.3 GB). Doers are in-process Sonnet subagents after `fgos dispatch decide` answers in-process (plan section 7.2).

| Order | Batch | Why here | Freeze or re-check |
|---|---|---|---|
| 0 | B0 tooling and area map | the channel for exact carries, conflict resolutions and retiring roots decides the cost of everything after; the area map freezes targets before authoring | none (no content) |
| 1 | B1 agent-coordination | removes 74% of rows with scripts; the 394 judgment rows are diff reviews; low churn (evidence last changed 2026-09-19); must come first so it cannot dominate later and so its mirror entries bind to final blobs | header edits to platform documents before decisions are computed (a header edit breaks file-level byte identity, so B1b decisions are per unit) |
| 2 | B2 host-invocation-routing | targets exist, 16 known drops, near-zero churn (5 commits, last 2026-09-15), best test of the corrected non-blind brief | none |
| 3 | B3 packaging-distribution | targets exist; does not wait for Plan C; `distribution.md` (31 rows) is hot, so its rows are decided last in the batch with a digest re-check | digest re-check before each commit of `distribution.md` rows |
| 4 | B4 root authorities, laws, work-state close | small documents, needs the owner answer on unmapped types (Q5); SC-1 text fix; `AGENTS.md` and `CLAUDE.md` rows are decided in B9 after the last sync | per-file pin; `docs/specs/reading-map.md` (24 / 9) re-checked before commit |
| 5 | B5 whole-system architecture | needs B2 to B4 target names for links; Plan B pointer lines land here | re-pin after Plan B |
| 6 | B6 proposals and redesigns | no targets; mostly whole-file placement by kind; low churn | none |
| 7 | B7 specs and ui-spec | new areas authored like Pilot B; `observe.md` (10 / 10) and `confinement-authority.md` (9 / 3) decided last in the batch | digest re-check |
| 8 | B8 runner | 96 / 61 commits and three pending writers: last, so main settles longest; source digest checked before every target commit; rows whose digest changed are re-done, not merged by hand | digest re-check, sync before start and before close; freeze only if the owner orders it (not requested) |
| 9 | B9 close | whole-corpus gates, promotion rehearsal, registry checkpoint, ledger destination | `AGENTS.md`, `CLAUDE.md` rows decided here |

Allowed overlap: while a batch's reviewers run, the Lead builds the next batch's area map and pin; no two batches author at the same time (keeps one generator run, one reviewer queue, and the Lead's verification serial). Agent coordination does not dominate: its 16,640 exact rows cost scripts and one spot-check, its 394 judgment rows are 7% of the judgment total, and it is done in batch 1.

### 4.1 Per-batch procedure (reuses the Pilot method with the fix-round corrections)

1. **Pin.** `git merge main` (never rebase), account new legacy-root edits in the ratchet exceptions (policy 7.5b), scratch `--refresh` carry-forward (0 ids lost), record per-source digests and main HEAD in `reports/phase-06/batch-<n>.md`.
2. **Target map.** Lead freezes (with one doer for batches over 400 rows): source heading range to `docs/platform/<area>/<doc>#<heading>` by constitution kind, one owner per row, subdivisions the map adds labelled added-in-candidate; additive candidate switchboard route for each new area (area status never changes).
3. **Candidate authoring.** One doer per target document, verbatim carry preferred, no new claims, exactly one H1, full header (candidate core plus the promotion fields: Implementation, Provenance, Writer type, Canonical for, Use this when, Do not use this for, Supersedes, Superseded by), links between candidates repointed, portal last. Commit per document, then `check-doc-candidate-status.mjs` (after the commit; untracked files are invisible to it, defect M-08).
4. **Decisions.** A script proposes exact carries and diff packs (B0 tooling); doers decide the judgment rows with the corrected brief: `promote`, `merge`, `split`, `supersede` only when the target carries the whole unit, `partial-carry` with a remainder, `unknown-blocking` with `searched`, `archive-with-reason`, `delete-as-obsolete`, `reject-with-rationale`, `defer-with-owner`. Non-blind: ledger, source inventory and audit documents are legitimate carriers (defect M-02). One shard per doer. Reviewed rows carry `targetUnitDigest`.
5. **Independent review.** 100% of judgment rows by fresh read-only reviewers who did not author them, in both directions; one defective row returns the shard once; the Lead recomputes 10% of rows by hand. Deterministic checks cover 100% of rows (anchors, digests, duplicates, unreferenced candidate blocks, exact-text proof, `decision-loss-without-partial-carry`).
6. **Gates** (table 4.2).
7. **Preview.** Link rewrite preview with the judgment queue for the batch sources, and draft alias entries generated from the reviewed decisions (not activated; `alias-table.json` stays empty until Phase 9).
8. **Fresh readers.** Two in-process read-only readers, answer key committed first, anchor lookup tool, area portal as the starting point, three change scenarios, six L5 questions each; at least 5 of 6 correct, 0 non-existent anchors, 0 legacy-authority answers; opened-file list cross-checked.
9. **Red-team.** `ak:plan red-team`, two hostile reviewers (assumption, failure mode) on the batch diff; Critical and High fixed without the owner, Medium and Low recorded; at most one re-review.
10. **Close.** Sync main, scratch refresh, carry-forward proof, changed rows re-done, batch report committed. Registry and manifest committed only at three checkpoints (after B2, after B5, at B9; about 12 MB compressed each, measured in Phase 5); between them verification uses the scratch inventory.

Known-answer controls (cheap, once per target class): B1b (diff review): 6 seeded mutations in a 30-row pack; B2: the 16 registered drops must reappear as restored or flagged, and the 7 control units of dropped-001 in B3 must reappear as deferred; B5 (authoring from sources with partial targets): the structural mutation run of E2 repeated once on the batch's shards (11 mutations, 0 findings on the clean copy). No other batch repeats them.

### 4.2 Gates per step

Always green after every commit: scratch gate run exit 0; `node scripts/check-legacy-docs-ratchet.mjs` exit 0; `env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/*.test.mjs` green (783 pass at the Phase 5 close); `check-doc-candidate-status.mjs` no finding for touched paths; `check-doc-constitution.mjs --check-placement` 0 leftover for new paths; `git diff 39630b398 -- docs/specs docs/architect docs/io-contract.md AGENTS.md CLAUDE.md docs/reading-map.md docs/specs/reading-map.md plans/260925-documentation-authority-unification/alias-table.json` empty beyond accounted exceptions; `git diff 39630b398 -- scripts/generate-doc-inventory.mjs` empty (no extractor change, procedure note 8.1); scoped strict for the batch (`--strict --scope <batch sources> --decisions <ledger dir>`) exit 0 at batch close, with the open-row count falling monotonically before.

Expected red until Phase 9: global `--strict`, `check-doc-retirement.mjs --cutover`, `check-doc-constitution.mjs --cutover` and `--promotion`. The batch report records the delta of each against the previous batch; a step that turns one of them green outside its scope is a defect.

### 4.3 Commit granularity and rollback

One commit per tooling change (tests first, red then green, as two commits when useful), per target document, per decisions shard (author), per reviewed shard, per area map, per batch report, per checkpoint refresh. `git commit -- <exact paths>` after a `pwd` and branch check, conventional messages, no phase or finding labels. Rollback per batch: `git revert` the batch commit range (documents, shards, map, report) in reverse order; the work is additive (new files, new shard files, additive switchboard routes, additive header and restore edits). Tooling commits are reverted separately and nothing else depends on them until a batch uses them. A checkpoint refresh reverts with its commit, returning the previous manifest and registry. Whole-phase rollback: reset to the Phase 5 closing commit `39630b398`; after it `git status` clean, scratch gate exit 0, ratchet exit 0, `docs/platform/` equals the Phase 5 content.

## 5. Cross-cutting work

| Item | Where | How | Decides |
|---|---|---|---|
| Restore the 17 dropped claims | dropped-002 to 017 in B2; dropped-001 in B3 | B2: verbatim restore into the host-invocation targets at the anchor the area map names, with a status note where implementation state is not verified; each register entry gets `reviewedDisposition` (restored at anchor, or restoration owner named, or intentional with evidence). dropped-001: the seven source units become `defer-with-owner` against a labelled stub heading in `docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md` ("not carried; restoration tracked by dropped-001 and Plan C"); register entry keeps its Plan C owner; related overclaim HI-I027 is reconciled in B2 | Lead per entry; owner only for an entry the Lead finds obsolete (Q4) |
| SC-1 text | B4 | candidate `contracts/cli-io-contract.md#entry-fields-and-effect-axes` states that the effect-axis verbs come from the manifest (15 verbs in `COMMAND_REGISTRY`), no exclusive two-verb list, no `coordination` example; the two held rows become reviewed (disposition recorded with the code evidence); legacy sources are not edited | owner decided "code is the truth" (7.5b) |
| Unprocessed rows of the Pilot A blind audit | B2 | all 431 rows decided again under current ids with the corrected brief; first-round shards stay as evidence and may be shown to doers as a prior | Lead, review 100% |
| 818 duplicate groups | B1 (816) and B9 (2 history) | 814 evidence mirror groups: file-level mirror decisions, legacy copy `delete-as-duplicate` against the platform copy (relocation policy recommendation, Q1); 2 history groups and the 78-file group: recorded resolution `retain-as-evidence`; the retirement check keeps excluding mirrors | rule, Lead |
| 151 semantic-conflict groups | B1 (138), B9 (12 history), B2/B3 (1) | a conflict-resolutions record (tooling T4) lists each group key with a rule id: `evidence-name-collision` (138; Lead samples 20 groups by hand and checks every path is an evidence payload), `history-no-authority` (12), `distinct-owner-by-area` (1, the two `implementation-alignment.md` files); any group the sample shows to be a real content conflict goes to the owner | rule and Lead; owner only for a real conflict (none known) |
| Promotion metadata for the 110 canonical documents | B1b (68 agent-coordination), B2, B3, B5 to B8 for new targets | full header at authoring (candidate core plus promotion fields), so no second pass; existing documents get headers by doers who may edit only the header block; `check-doc-constitution.mjs --promotion` goes to 0 headerless and 0 missing at B9 | Lead |
| Retirement-check roots | B0 tooling T5, data from the area map | roots become `docs/specs/`, `docs/architect/` plus the list of retiring root documents the area map names (`docs/io-contract.md`, `docs/platform-foundations.md`, `docs/routing-handoff-contract.md`, `docs/architecture-map.md`, `docs/coexistence.md`, `docs/operator-runbook-herdr-cockpit.md`, and `docs/decisions/` as a retiring generated projection) | owner approves the tooling (Q2); Lead lists the roots |
| Identity rule | all batches | no change to the unit definition of `scripts/generate-doc-inventory.mjs` for the whole phase; guard: the diff of that file against `39630b398` must be empty at every commit; a change that cannot wait is a stop condition | owner |
| Registry refresh and main syncs | batch start and close; three committed checkpoints | exceptions policy 7.5b: each sync appends the new main-side edits to `scripts/check-legacy-docs-ratchet.exceptions.json` as accounted exceptions (content-review-owed); the batch re-decides every row whose digest changed, which is the content review of that file's exceptions; exceptions of files outside any batch (none expected) are reviewed at B9 | Lead |
| Alias table drafts and link queues | every batch step 7 | generated from reviewed decisions; coverage reported against the 973 legacy paths that history reads by path; judgment queue for edges with no derivable target (Phase 8 prerequisite also for Phase 6 sources, phase 8 file) | Lead proposes, owner decides ambiguous edges in Phase 8 |
| Ledger destination | B9 | create `docs/platform/history/documentation-authority-unification/` with a README (history kind), the snapshot format and a dry-run snapshot of the decisions plus digest verified by script; the sealed final snapshot is produced at Phase 9 step 2 after the drift rerun | Lead |
| Evidence mirrors | B1a | mirror decisions only; the relocation manifest and verifier are Phase 8 (relocation policy section 5); no payload byte is touched | per Q1 |

## 6. Cost and duration (E11-based; UNPROVEN)

Measured inputs (Phase 5 defects report section 4 and fix round): 41 in-process Sonnet runs, 112k to 250k tokens each, about 6.5 million tokens in the first round (mean 160k per run), 1.5 million more for the fix round and re-runs; Pilot A audit 600 rows in 7 runs (86 rows per run, 2.4k tokens per row, 2.9 s per row); Pilot B author plus reviewer 366 rows in 12 runs (61 rows per run, 4.8k tokens per row, 1.3 s plus 0.9 s per row); candidate authoring 26 to 88 s per document; fresh readers about 55 s; at most 4 runs in parallel; a gate run about 40 s and 2 GB.

Assumptions: 160k tokens per run (range 112k to 250k); 70 judgment rows per author run and per reviewer run; exact rows cost no doer tokens if the B0 tooling is authorized; per content batch 2 red-team and 2 fresh-reader runs; B6 whole-file placement by kind needs only triage readers and reviewers; B8 authors are split by source size (about 55 KB per author) so rows per run is lower; no rework allowance beyond one return per shard.

| Batch | Judgment rows | Doer runs (authors + reviewers + other) | Tokens, M (range) |
|---|---:|---|---:|
| B0 tooling and map | 0 | 2 code + 2 code review + 6 map | 1.6 (1.1 to 2.5) |
| B1 agent-coordination | 394 | 4 + 4 + 9 (headers 4, spot check 1, red-team 2, readers 2) | 2.7 (1.9 to 4.3) |
| B2 host-invocation-routing | 431 | 6 + 6 + 9 (restore 3, headers 2, 4) | 3.4 (2.4 to 5.3) |
| B3 packaging-distribution | 402 | 6 + 6 + 5 | 2.7 (1.9 to 4.3) |
| B4 root, laws, work-state | 609 | 9 + 9 + 7 | 4.0 (2.8 to 6.3) |
| B5 architecture | 826 | 12 + 12 + 6 | 4.8 (3.4 to 7.5) |
| B6 proposals, redesigns | 1,815 | 4 + 4 + 5 | 2.1 (1.5 to 3.3) |
| B7 specs, ui-spec | 557 | 8 + 8 + 5 | 3.4 (2.4 to 5.3) |
| B8 runner | 470 | 8 + 8 + 9 (map 1, resync reserve 4, 4) | 4.0 (2.8 to 6.3) |
| B9 close | 0 | 6 | 1.0 (0.7 to 1.5) |
| Total | 5,504 | about 185 runs | about 30 M (21 to 46 M) |

(B4 includes the 84 rows of three non-authority root documents; the total is 5,420 open legacy judgment rows plus 84.) Compare Phase 5: about 8 M tokens for 966 first-round rows plus tooling, fix round and re-runs; Phase 6 is about 3.7 times the tokens for about 5.7 times the judged rows.

Without the B0 channel for exact carries (owner question Q2, option B): the 16,640 exact rows become hand-written reviewed rows, estimated at 1.5k tokens per row (UNPROVEN, below the Pilot B rate because no judgment is needed) = about 25 M tokens more, about 12 MB of shards, and B6 at pilot rate adds about 7 M: about 60 M tokens in total.

Duration: serial subagent time at the measured per-row rates is 5,504 rows x about 2.5 s = about 3.8 hours, about 1 hour at 4 in parallel; the pacing item is the Lead (verification, 10% recompute, red-team adjudication, carry-forward proofs, syncs). Phase 5 took about 2 calendar days (2026-10-06 to 2026-10-07) for 966 first-round rows plus tooling, the fix round and re-runs. Estimate 8 to 12 calendar days for Phase 6 (B0 1 to 2, B1 1, B2 1 to 1.5, B3 1, B4 1, B5 1.5, B6 1, B7 1, B8 1.5 to 2, B9 1; overlap of Lead-only steps with reviewer waits already counted). UNPROVEN: neither the tokens per run nor the Lead time for 185 runs has been measured at this size.

Cost checkpoints (reported, no owner wait unless a stop condition fires): after B2 and after B5, compare actual tokens per judgment row with 4.8k; above 1.5 times that is a stop condition.

## 7. Exit criteria and stop conditions

Defined in the phase file (section Success Criteria and section Stop Conditions); summarized: measurable counts at batch and phase level, the three verdicts PASS, PASS-WITH-AMENDMENTS, METHOD-MUST-CHANGE, and the owner-owned close.

## 8. Not asked, decided in the plan

- Authorization: Phase 6 is one owner authorization; the Lead reports at the B2 and B5 checkpoints and continues unless a stop condition fires (no "continue?" between batches).
- Review: 100% independent review of judgment rows (sensitivity simulation: a 20% sample catches a rare judgment defect in about half of the runs); script proof for exact carries with an independent spot check of 100 random exact rows per batch; the Lead recomputes 10% per shard. An adaptive sample is not proposed: the saving (about 2.5 M tokens of 30 M) does not pay for the risk.
- Harness: plan section 7.2, in-process Sonnet doers, `fgos dispatch decide` before every dispatch, at most 4 in flight, Lead is the only committer, no doer commits or runs git writes.
- Freeze: none during Phase 6; digest re-check before each commit of a hot source; the write lease belongs to Phase 9.
- Packaging does not wait for Plan C; dropped-001 stays open with a stub anchor.
- Candidate headers carry the promotion fields from the start.
- Registry and manifest committed at three checkpoints only.
- No extractor change in this phase.
- Different reviewer family: not available in-process; the Lead 10% recompute and deterministic checks are the countermeasure (Phase 5 risk row); the Lead may run one review pass on Opus for B5 and B8 if a hostile pass finds a class of defect the Sonnet reviewers missed.

## 9. Owner question bundle

Five questions. Each option stands alone.

**Q1. Dispositions for the evidence mirrors (867 files: 302 Markdown, 565 other; 12,882 rows).** The relocation policy (Draft, `evidence-payload-relocation-policy.md` section 6) recommends deduplication: keep the platform copy, delete the legacy copy at cutover step 6, no new ratchet exception kind, dispositions follow the constitution's location rule. Phase 4 accepted the lease design but did not record answers to this policy's decisions 1, 2 and 5.
- (a) Confirm decisions 1, 2, 5: the legacy copy is `delete-as-duplicate` against its byte-identical platform copy (target owner required, which exists), deleted at the cutover; the platform copy is the `evidence-payload` owner.
- (b) `retain-as-evidence` for the legacy copy: both copies stay until the cutover and the legacy one is archived somewhere at cutover; needs a new destination and adds a move of 17 MB.
- (c) Decide later: the 867 files stay `unknown-blocking`, the retirement gate stays blocked on them, B1a is empty.
Recommendation: (a). 867 of 867 blobs are identical (relocation policy 2.1), no runtime reader exists (policy 3), and (a) is the smallest change to payload bytes (none).

**Q2. Authorize a bounded gate-tooling set, and settle two semantics it needs.** Tooling (scripts only, tests first, one independent code review and at most one re-review, default behavior byte-identical, generator untouched, `scripts/generate-doc-inventory.mjs` unit definition not changed): T1 mirror-file entries in decision shards (the gate checks blob equality at check time and expands the rows); T2 `scripts/propose-doc-decisions.mjs` and an exact-carry entry (the gate re-checks digest equality at the anchor); T3 corpus-rule entries (a rule decision for a whole corpus, checked against the item classification); T4 a conflict-resolutions record read by `no-unresolved-conflicts`; T5 retiring roots as data in `check-doc-retirement.mjs`; T6 reverse check as open data (candidate blocks no decision names, defect M-09) and `--decisions` for `check-doc-constitution.mjs` (M-10), `check-doc-candidate-status.mjs` reading untracked files (M-08), repeatable `--decisions`; T7 vocabulary amendment 2.4-001 moving `delete-as-duplicate`, `defer-with-owner`, `move`, `extract`, `redirect`, `reject-with-rationale` to in-use once used (additive, evidence recorded after use as in 2.2-001).
- 2a, tooling: (A) authorize T1 to T7; (B) authorize T1, T2, T4, T5 only; (C) none, the Lead uses scratch scripts and every row is a hand-written decision.
- 2b, semantics: may a row proven by script to be byte-identical (or a byte-identical file mirror) be `reviewed` with `reviewedBy` naming the script, with one independent spot check of 100 random such rows per batch? The vocabulary says `reviewed` only after independent review today; (yes / no, every exact row is also read by a reviewer, which is 16,640 rows).
- 2c, corpus scope: the global strict and retirement `claims-reviewed` checks count 32,495 history rows, 10,506 user-knowledge rows and 2,758 consumer-project rows that are not legacy sources. (i) one owner-reviewed corpus rule each (`retain-as-evidence`, `reclassify-out-of-platform-scope`), rows expanded and reviewed by T3; (ii) change the gates to count only the platform-authority corpus (a gate semantic change, owner decision per the constitution's amendment rule); (iii) leave global strict permanently red and use scoped strict only.
Recommendation: 2a (A), 2b yes, 2c (i). Cost: with A and 2b about 30 M tokens (21 to 46 M) and 8 to 12 days; with 2a (C) or 2b no about 60 M tokens, about 12 MB more shards, B6 and B1 dominate, UNPROVEN. 2c (i) keeps one global measurable cutover criterion without changing gate meaning; (ii) is the smaller change but edits the strict definition.

**Q3. Files with no target and no promoted counterpart (B6 and B7 and parts of B4: 14 proposals, 5 redesign and discussion documents, domainization, 21 ui-spec files, 11 templates, 7 specs singles; about 3,000 rows).** (a) Place by constitution kind with the text verbatim: proposals to `docs/platform/proposals/**`, historical or superseded material to `docs/platform/history/**` with `archive-with-reason`, live specs to `docs/platform/<area>/spec.md` and contracts, split only where one file mixes kinds; rows script-proven where verbatim; the Lead triages each file with evidence and the owner sees the list once per batch. (b) Full claim-level re-authoring of every file. (c) Move the whole `docs/architect/proposals/**` and the redesign documents as one history bundle without per-file review. Standing delegation asked with (a): the Lead may disposition a file `archive-with-reason` (text relocated verbatim, never deleted) when evidence shows its claims are carried elsewhere or are historical; any `delete-as-obsolete` always comes to the owner.
Recommendation: (a) with the delegation. It satisfies "separate current state, intent, obligation, rationale, decision and proof" only where a file mixes them, costs about 2.1 M tokens for B6 against about 9 M for (b), and loses no text; (c) skips the per-file evidence that a proposal is not still a live obligation.

**Q4. The sixteen host-invocation drops and the open dropped-001.** (a) Restore dropped-002 to 017 in B2 as verbatim carries at the anchors the area map names, with an implementation-status note where code does not match (some are finished-phase execution detail or placeholder budgets: the Lead checks each, restores all that are still settled design, and returns to the owner only entries it finds obsolete); dropped-001 as in the plan (stub anchor, `defer-with-owner`, Plan C). (b) Register only: keep the entries open until the cutover preparation (Phase 5 behavior). (c) Restore all 17 including dropped-001 verbatim now, flagged "not implemented in code".
Recommendation: (a). Phase 9 needs a reviewed disposition for every entry and the B2 authors are already editing those targets, so a second pass costs more; (b) postpones a cheap step into the cutover window; (c) overrides the 2026-10-06 owner decision on dropped-001 (restore after the cutover through Plan C).

**Q5. Root documents that stay at `docs/` root, the eight unmapped document types, and the instruction layer.** The constitution places `reading-map` at `docs/reading-map.md`, but has no kind for `docs/doc-governance.md` (type Governance), `docs/transitional-switchboard.md`, `docs/README.md` (Documentation portal), the user docs portal, `migration-authoring-rules.md` (temporary exception), two Migration plans and one Architecture design, so their rows have no valid target kind. `AGENTS.md` and `CLAUDE.md` (104 rows) are always-loaded instruction layers rewritten in Phase 8, with Plan B still to write `AGENTS.md`.
- (a) Additive constitution amendment: new kinds `governance` (`docs/doc-governance.md`), `portal` (`docs/README.md`, `docs/user/README.md`), `switchboard-doc` (`docs/transitional-switchboard.md`, retired at cutover), Migration plans become `history` by `archive-with-reason`; `AGENTS.md` and `CLAUDE.md` rows `reclassify-out-of-platform-scope` (they stay; Phase 8 repoints their links).
- (b) Move them under `docs/platform/` (for example `docs/platform/governance.md`); every consumer of `docs/doc-governance.md` is then a Phase 8 rewrite.
- (c) Decide per document in the batch, each as a recorded exception.
Recommendation: (a): six documents, no path moves, additive and recorded by exception under the amendment rule; (b) multiplies consumer rewrites for no authority gain.

## 10. Unresolved

- Whether Plan B reads or writes `docs/platform/host-invocation-routing/contracts/component-protocol.md` and the HIR intent ledger (two mentions each; not verified).
- Whether the council-parity plan writes `docs/specs/runner.md` (one mention).
- Whether the 138 evidence name-collision groups contain a real content conflict (rule plus a 20-group sample is the proposed check; UNPROVEN until sampled).
- Whether candidate rows become non-blocking when the switchboard flips at Phase 9 (the three promoted portals show `promote`, 86 rows): a throwaway-clone rehearsal at B9 measures it; UNPROVEN before that.
- Token cost per run at this size and Lead time for about 185 runs.
- Whether all 16 host-invocation drops are still settled design (the Lead checks each against code and git history in B2).
