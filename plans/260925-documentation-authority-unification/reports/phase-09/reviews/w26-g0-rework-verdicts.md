Verdicts: 65 APPROVE / 7 REWORK

# G0 binding rework review (594fe4194)

Pin `39528fa211f9a7e558b1e95467eeae1f66b68a3d`. The reviewed commit is `594fe4194` (merged at `3f225cfe7`). Brief: `w25-g0-rework-brief.md`; rulings L13-22 and L13-23. Machine records: [w26-g0-rework-verdicts.json](w26-g0-rework-verdicts.json).

## Population

`g0join/join.py --pin HEAD` exits 1 with 57 effective rows that have errors: 23 missing, 34 mismatched and 6 open REWORK, with some rows in more than one group. I also gave verdicts to 15 rows outside that set:

- the 12 s9 move->supersede re-decisions that the join still counts as approved through older digest-bound verdicts, or does not track at all;
- `g0-content-redecisions` `/bindingRefresh/124`, `/125` and `/126`.

All 57 join rows match exactly one verdict here (checked with `join.relevant`).

## Method

- **Hashes.** Every stored `bindingSha256` recomputes with `ledgerfix/bindings.py` `digest()`.
- **Target units.** Every target was extracted with `rebind.py extract()`, from a tempfile copy, with `--no-addons`. Each anchor resolves to exactly one unit, its digest equals `targetUnitDigest`, and the self-inclusive ancestry matches. Group rows were checked with `matches()` over all eight members.
- **Source units.** Each source was found by its digest across every git revision of its file.
- **Changed clauses.** For each `changedClauses` row, the old wording was checked against the bound source and the new wording against the target. I then applied the clauses to the source and diffed the result with the target to find unaccounted text.
- **Changed facts.** New facts were checked against code: `discovery.mjs:383-416`, `fgos-shell-integration.sh`, `friction_cli.rs`, `hot-lock.mjs`/`store.mjs`, `terminal-control/config.mjs`, and the `archive/plans` path.

## REWORK

1. **s7-step09-n1-runner-predecessors `/registryGaps/0` and `/1`.** The `changedClauses` old wording is the intermediate N1-repaired text (2416/2354/2590/2897 and 2477,2609/2897). The bound source units cite something else: d631e41b cites 1958/1959/1871/1986/1995/2172/2890, and 59d3caa3 cites 2470,2602/2890. The rewritten rationale also dropped the N1 provenance (b919e2b9b and the native successor claim ids). Name the source citations as the old wording, or keep the N1 step explicitly.
2. **s14-resync-b `/bindingRefresh/8`.** Binding 0 now has exactly the same effective target as s11 `conservedClaims/7/bindings/2` (work-state 0032, f617f1c0). That is a new duplicate effective row, the defect class item 4 of the brief removed. Record binding 0 as an explicit drop, or link it so that only one row stays effective.
3. **s4-packaging-distribution-successors `/registryGaps/22` and s5-root-authorities-boundary-gaps `/registryGaps/3`.** Their residual proof `import2/partial-carry-residuals.json` rows 0 and 1 still binds primaryTarget 299c5b49 and file sha 8a974e88. Those are the values from before the code-span restore; the current values are e8167a0a and 85a7a1f8. The residual text itself is still correct. That file was outside the write set, and `rework-blockers.json` does not mention it. Refresh both residual rows.
4. **g0-content-redecisions `/bindingRefresh/125` and `/126`.** The `supersedesBinding` links to `/20` and `/21` are right. The rationales still say these rows supersede s14 `/574` and `/577` and that `/20` and `/21` are current. Correct the text.

## Checks other than per-row verdicts

- **s9 move->supersede (19 rows): APPROVE.**
  - All clauses are authenticated against their witnesses, with no unaccounted text.
  - No s9 row is still labelled move with unequal digests.
  - `/claims/14` now binds block-7; it drops the Phase-2 migration sentence and says why.
  - Note: `/registryGaps/39` still says `events.lock` where legacy `runner.md:905` now has the hot state mutex. This is resync lag, not caused by this commit.
- **27 held rows: APPROVE.**
  - 11 missing hashes were computed.
  - The 16 group rows get the common digest of all eight members.
  - The old values are kept in `priorReview.g0ReworkBefore`.
- **124->6 / 125->20 / 126->21 links: REWORK (text only).** Each lineage is now one continuous chain. The splice rewrote earlier `supersedesBinding` preimage digests (s12 `/364`, s14 `/574` and `/577`, and the predecessors of g0 `/6`, `/20` and `/21`); the originals survive only in snapshots.
- **docs/platform edits: APPROVE.**
  - The code span at h-6979005beaf7 `spec.md:191` is now byte-equal to legacy `runner.md:1123`.
  - The other edits were allowed by the brief and are true: 11 runner.md re-cites in h-7af1f0242611 (checked at HEAD), its metadata note, and one restored RUL59 sentence.
  - Nit: the rewritten note sits next to the A19/A35 sentence that says `runner.md:<line>` text is kept verbatim.
- **Code-span scan: APPROVE.**
  - The scan covers 1198/1198 files with the marked lexer.
  - My own marked scan found no missed inline span.
  - It did find 2 rewriter edits inside fenced code blocks, which a codespan-only scan cannot see: `workflow/spec.md:420` and `component-boundary.md:549`. Both are path retargets to existing files, so no code meaning is lost. The Lead should decide whether fenced code must stay byte-verbatim.
- **rebind.py and test_rebind.py: APPROVE.**
  - The group check authenticates every member. The single-anchor path is unchanged.
  - `--check` passes a drifted origin only when its exact live successor matches.
  - Tests: 3/3 pass. `--check` exits 0 with drift 0.
  - No check was weakened. The relaxation does not verify why the successor exists.
- **For information:**
  - The join tracks digests only. About 70 rows whose rationale, disposition or reviewStatus changed in this commit keep their older approvals.
  - Pre-existing and out of scope: 5 s13 rows drift on `work-state/contracts/non-transitioning-records.md` (changed in 30ed2bbf4), and the s9 `/registryGaps/27` residualRef is stale.
