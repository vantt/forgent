# W10 composition rework review

**Verdict: REWORK (one low-severity line). 9 APPROVE, 1 REWORK.** Machine file: [w10-composition-rework-review.json](w10-composition-rework-review.json).

Scope: commit `928f5cc14` against [w9-composition-rework-brief](../w9-composition-rework-brief.md) and [w9-composition-fix-review](w9-composition-fix-review.md). Reviewed at the commit bytes; the two later commits (`4f08d504d`, `83305ec4d`) touch neither `docs/` nor `composition/**` (only one line in `s16-import2-resync.json`).

Method: I exported the commit tree subset (docs, the patched non-docs files, scripts/src/core/plugins/.agents/.claude/domains, ledger, pilot, the phase-06 extractor manifests, the phase-08 step-07 patches) to `/tmp/fgos-work/w10-comp-review/`. I replayed with my own script, ran the shared `ledgerfix/bindings.py` there, then deleted the scratch. The extractor adapter's output directory was relocated in the scratch copy only. No git write, no fgOS CLI, no npm test.

## Findings

### F1 — Scope: APPROVE
All 17 changed paths are under `reports/phase-09/composition/` or `ledger/decisions/`. No `docs/`, code or test path changed.

### F2 — GAP-05 body overlays: APPROVE
On the moved tree, `bindings.py` (`documents`, `supersessions`, `effective`, `catalog`, `unit_for`, `digest`) gives:
- With the new body shard removed: 177 component-boundary assertions are unresolved. 171 of them end at `s14-resync-b.json` (162 `bindingRefresh`, 9 `unitCarries`). This matches the W9 review.
- With the shard: **0 moved units unresolved**. 6 component-boundary assertions remain (5 `s15-navigation-review-fixes`, 1 `s3-host-invocation-boundary-gaps`, 4 distinct). These are the table-edit drift the W9 review already named, not moved units.
- I checked all 90 overlays, not a sample. For each one: the `bindingSha256` reproduces, and so does the hash of its `supersedesBinding`. The supersedesBinding payload equals the live s14 row. The target is the history file. The unit resolves uniquely by anchor and digest. `textDigest` equals the old digest, and the **unit text is byte-equal** to the old component-boundary block. Ancestry equals the recorded `targetAncestry`. No ambiguous supersession edge exists, because `supersessions()` asserts that.
- All 171 `coverage` joins resolve through `effective()` to the recorded overlay pointer.

**The 90-vs-171 arithmetic is honest.** The 171 originating assertions are 90 s14 rows (81 `bindingRefresh` + 9 `unitCarries`) plus 81 s6 `claims` (41 + 40). Those 81 claims already supersede into the same 81 s14 rows. So "162 bindingRefresh" counts occurrences: 81 distinct rows, each reached twice. Writing 171 overlays would have needed two supersession edges to the same row, and `supersessions()` rejects that. The brief's "one overlay per row" wording inherited the occurrence count. The Doer explains this in the receipt and in `countExplanation`.

### F3 — 44 lookup-only rows kept out of G0 counting: APPROVE (note)
The new heading file's `bindingRefresh` (44 `binding-overlay`) plus `alreadySupersededHistoricalBindings` (22 already-superseded + 22 preimage lookups) is the same 88 records as the parent commit, as a canonical-JSON multiset. `alreadySupersededHistoricalBindings` is in `bindings.SNAPSHOTS`, so `rows()` now yields 44. No resolver change was needed. All 44 heading overlays verify (hash and ancestry). No other record points into this file by `/bindingRefresh/N` index, so the index shift breaks nothing.

Note: the file-level `counts` (12/10/66 = 88) still sums all records. A counter that reads `counts` instead of `rows()` would still see 88. `operativeOverlayCount: 44` sits next to it, so this is not blocking.

### F4 — Seven gloss lines: APPROVE
Only witnesses 3, 9, 15, 33, 86, 87 and 96 changed between the parent and this commit. All seven now read as grammatical prose, and the substituted meanings match the reviewed D-ids:
- D4 is the controller-owned argv rule.
- D9 is the project consumer stream.
- D18 is the publication-reader pin.
- D8 is the worktree-admin scope.
- D3 and D8 are the Process Facts leaf and the domain-control consumer boundaries.
- In terminal-control, D4 is the grace rule and D7 is the deferred tmux/workspace work.

#86 and #87 use identical wording, so the "theo tên" cross-reference in #87 still matches the title in #86. Minor stylistic repetition remains but is not broken: #33 "the dated decision … carry the dated amendment", #96 "deferred … (the deferred … decision)".

### F5 — Patch replay `--fuzz=0`: APPROVE
My own replay ran `effectiveSpecIds` then `finalPinFSpecIds`, resolving predecessors by `expectedAfterSha256` (including the external step-07 patches). Result: **106 applications (79 + 14 + 13 predecessors) on 74 files**. For every step I checked the before hash, the after hash, and that `rollbackDiff` restores exact bytes before reapplying. All 104 gloss witnesses' `after` lines equal the replayed bytes at their recorded line.

### F6 — Citation drift scan: APPROVE
Each scan ran after `node scripts/build-skill-wrappers.mjs`, which exited 0.
- Full chain with F: `check-decision-citation-drift.mjs` exits **0**, "no findings."
- Chain without F (negative control): exits **1**, "130 finding(s)".
- Baseline is byte-unchanged; sha256 is `ac0a6e98…4fff`, matching the receipt.

### F7 — Residual drift disclosure: APPROVE (note for Lead)
I reproduced the receipt exactly: 13,752 assertions, 12,510 distinct effective bindings, 285 target files, 0 missing, **556 unresolved assertions / 407 distinct**. It is described truthfully as not all green, inventoried in `w9-unresolved-bindings.json`, and the systemic rebind is assigned to the Lead in `remainingExternalGates`.

The receipt does not split this number. I did: on the unpatched pin tree, excluding the not-yet-existing history file, 46 distinct bindings are already unresolved. All 46 remain. **361 distinct bindings are newly broken by the composed chain.** The largest groups are s14-resync-b (166), s11-preflip-carries (95), s4-packaging-distribution (23) and s5-root-mapped-conservation (22). This is the Lead-owned rebind work. The 361/46 split is useful when sizing it.

### F8 — `actions/4` path: APPROVE
`path` = `effectivePath` = `successor` = composed spec path = `docs/platform/workflow/spec.md`.
- `beforeSha256` = `currentSourceSha256` = the spec's `beforeSha256` = the holder bytes at the commit.
- `expectedAfterSha256` equals the replayed holder after the chain.
- The legacy source is kept under explicitly named `legacySourcePath`/`legacySourceSha256`. `id` stays `file:docs/specs/workflow.md` as the identity, which the receipt states.

### F9 — Receipt counts and exits: APPROVE
- `w9-commands.json` holds 2,211 commands: 2,207 exit 0 and 4 exit 1.
- The 4 exit-1 commands are 1 extractor run (missing registry fixture) and 3 pre-F citation negatives. This matches the receipt table.
- Development attempts (overlays/verify first runs exit 1, two tool timeouts with no invented exit) are listed separately and honestly.
- 424 patch invocations = 106 × 4 (forward, rollback, reapply, final reverse).
- Every count I reproduced matches: 106/74, 130→0, 177→6, 556/407, 0 moved unresolved, 44 `rows()`, 134 overlays.

### F10 — Witness #16 still reads broken: REWORK (low)
`docs/platform/event-store/spec.md:1138` (`w8:gloss:docs/platform/event-store/spec.md`), unchanged by this commit:

> `project:<name>` consumer streams (plan porting uses `project:porting`, Work keeps `project`)

Removing "D9:" leaves "plan porting uses", which reads as a noun phrase. It is the same class as the seven fixed lines; the W9 review missed it. Fix: "(in the plan, porting uses `project:porting` …)" or reuse #9's wording ("the plan's project consumer stream clarification: porting uses …"). Then regenerate that spec's diff and witness and rerun the replay and scan. #35 "the red-tests-first order (order)" and #36 are redundant but grammatical; that is optional polish.

## Recommended actions
1. Reword witness #16 (one line in the event-store gloss spec), regenerate, and replay.
2. Lead: when sizing the systemic rebind, use 361 chain-induced + 46 pre-existing distinct bindings, not 407 as one class.
3. Optional: make the heading shard's `counts` reflect 44 operative rows, or label it as all records.
