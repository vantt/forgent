# Step 7 integration re-review (A38, round 2)

- Worktree `/home/vantt/projects/forgentX-s8-review` at `7df3f2e34955494090ccb81e83b53b3b6f515ee0` (confirmed). Change reviewed: `a0aa5a2ac..7df3f2e34`. Rulings: `step-07-integration-fix-brief.md` and the L12-120 entry in `owner-answers.md`. Assembly pin: `244a0435466a46e56cd95b4a70bfe03f54670996`.
- Method: read-only. I ran everything in a `git clone --shared` scratch copy checked out at `7df3f2e34`. The assembler needs `git show`/`rev-parse` at the pin, so a plain archive copy cannot run it; the scratch clone stands in for the archive copy. Patches were applied in `scratchpad/s7-review/patchwork`. No worktree write, no git write in the worktree, no fgOS CLI, no `.fgos`, no test suites.

## Verdict: **rework** (narrow)

Checks 2–5 pass, and all 39 overturns are correct. What is left is part of check 1. The new post-move proof does not actually re-test about 1,133 moving-operand preserves. It exempts them by role (`step-07-post-move-proof.mjs:105-107`). That exemption hides 12 rows whose recorded "retained path" premise is contradicted by the effective move set. Several of them sit next to identical pointers that this same turn patched. Seven more rows in `AGENTS.md` need a Lead ruling.

## Findings

### R2-F1: Medium. 12 preserves rest on a "retained" premise the move set now contradicts, and the role whitelist skipped them.

`step-07-post-move-proof.mjs` puts every moving preserve whose `role` is in a fixed whitelist into `historical-fixture-or-frozen-gate-operand`, and copies `item.reason` without testing it. The whitelist roles are `navigation`, `inherited-document-reference`, `comment-provenance`, and others.

Most of the 1,133 rows are legitimately historical:
- 1,037 frozen ratchet baseline entries, plus 43 exceptions. These retire together with the ratchet.
- Dated `doing-coordination-redesign` provenance, whose reasons explicitly say "source tree retires".

The following live pointers are different. Their reason says "Retained native path … stays literal" or "retained root", but their target is physically retired by the effective move set. In several cases a sibling of exactly the same kind was flipped to patch in this same turn.

| Row ids | File:line | Operand (moves to) | Inconsistent with |
|---|---|---|---|
| r01010 | `apps/fgos-gateway/web/src/App.tsx:24` | `docs/ui-spec/screens/S01-sign-in.md` (→ `docs/platform/ui-spec/architecture/screens/…`) | r01008 `App.test.tsx:6`: same S01 comment, patched |
| r01106, r01108 | `web/src/screens/TaskDetail.tsx:487, :9` | `docs/ui-spec/{modals/M03…, screens/S03…}` | same pattern as r01008 |
| r01135, r01136 | `web/src/screens/Taskboard.tsx:439, :9` | `docs/ui-spec/{modals/M03…, screens/S02…}` | same pattern as r01008 |
| r00820 | `apps/fgos-gateway/Cargo.toml:44` | `docs/contracts/fgos-gateway-api-v1.yaml` (deleted at cutover per L12-96) | gateway.rs doc comments L2/L40/… (r00953, r00957, …) patched |
| r01033 | `web/src/api/client.ts:76` | same contract path | same as above. This is a "Typed wrapper over …" description, not one of the line-number citations the gateway carry protects. |
| r01037 | `web/src/api/types.ts:1` | same contract path | same as above |
| r04466 | `herdr-dashboard/src/pane_scan.rs:27` | `docs/operator-runbook-herdr-cockpit.md` (→ `docs/platform/herdr-web-dashboard/operations/operator-runbook.md`) | none patched; the pointer is present-tense |
| r14203 | `src/runner/dispatch/assignment-runner.mjs:347` | `docs/routing-handoff-contract.md` (→ `docs/platform/runner/contracts/routing-handoff.md`) | none patched; the pointer is present-tense |
| r02200, r04182 | `docs/architecture-manifest.json:3`, `docs/platform/contracts/architecture-manifest.json:3` | `docs/architecture-map.md` (in the move set; its own family `r26:docs/architecture-map.md` is **parked** pending a content check) | preserve conflicts with the parked move decision; these should depend on that park, not preserve |

**Correction:**
1. Flip the 10 pointer rows to patch, using the same treatment as r01008 and the gateway co-cut.
2. Make r02200 and r04182 depend on the `docs/architecture-map.md` park (park them, or turn them into a conditional co-cut).
3. Replace the role-whitelist exemption with a real premise test: a moving preserve may stay preserve only if its reason is dated or retirement-acknowledging provenance, or frozen data that retires with its gate. A reason claiming "retained"/"current" for a path the move set retires must fail.

### R2-F2: Medium, Lead ruling needed. Seven `AGENTS.md` pointers to retiring roots stay preserve.

The rows are r00764 (L8), r00732 (L13), r00761 (L60), r00762 (L63), r00731 (L122), r00733 (L134) and r00737 (L142). They point at `docs/platform-foundations.md`, `docs/routing-handoff-contract.md` and `docs/distribution-vision.md`. The effective move set physically moves all three, to `docs/platform/platform-foundations.md`, `docs/platform/runner/contracts/routing-handoff.md` and `docs/platform/packaging-distribution/history/distribution-vision.md`.

Their premise comes from the settled L12-60 ruling ("switchboard canonical route / retained source"). I am not reversing it. But this turn itself patched another live pointer to the same file: r18863 (`src/setup/registrations.mjs:3014`, `docs/distribution-vision.md`).

**Lead question:** confirm that the AGENTS packet (A34 / Phase 9 composition) owns these 7, and record that against the rows. Otherwise, flip them like r18863.

### R2-F3: Low. The L12-120 overturn split does not match the proof.

The L12-120 text says "23 gateway + 9 conditional R28". `step-07-post-move-proof.json` labels them `gateway-fixture-co-cut` 16 and `conditional-r28-preserve-overturned` 16. The 39 ids are the same in both; only the split is wrong. Correct the prose.

### R2-F4: Info. One stale record locator.

r18863 records line 3209; at the pin the line is 3014. The composed patch hunk is placed correctly. Only the historical locator is stale.

## Checks requested

1. **The 39 overturns: pass.**
   - All 39 are `prepared-for-cutover` and match `step-07-integration-inputs.json#reevaluations`.
   - My independent rejoin finds exactly those 39 rows as the only differences from v1+v2.
   - All 32 additional rows checked (not just 15). Each operand line falls inside the composed spec's hunk, and the removed line carries the operand. The 23 gateway rows are covered by `composed:apps/fgos-gateway/src/{gateway,mcp}.rs`, including the `create_dir_all("docs/contracts")` parents. The 9 R28 rows are covered by the specs for App.test.tsx, citation-format, backfill, check-doc-candidate-status, next-doc-id, registrations, decisions-corpus-retired and status-category.
   - The 4 generated enduser rows carry `patch via existing generator` (`generatedAction`, not applied, with an owner). The scan removes exactly the 2 duplicate entries (492 → 490).
   - My own scan over all remaining preserves is the source of R2-F1 and R2-F2.
2. **Composed enduser test patch: pass.**
   - All 18 prepared specs pass the roundtrip on pinned bytes: `patch --fuzz=0 -p1` forward gives `expectedAfterSha256`, and the rollback restores the pinned bytes exactly. This includes `composed:test/report/enduser-index.test.mjs` and `composed:test/report/helpers/docs-index-state-fixture.mjs`.
   - L162 and L167 now use `REAL_DEMO_DOC_PATH`, which is already imported at L12. L385/386 use the knowledge holder. The fixture constant moves to the knowledge path.
   - The surviving knowledge entry has quadrant `how-to`, the same title and `sourceCaptureId doc-fgos-rollup-howto`, so all assertions stay meaningful. None is weakened.
3. **Single replay door: pass.**
   - `python3 -B …/step-07-assemble.py --final --pin 244a0435…` alone was run twice. Both runs exit 0 with identical stdout, and the clone's `git status` stays clean. All 7 outputs are byte-identical to the committed files: matrix, patch-order, readiness, report, obligations, prepared-specs and park-resolution-applied.
   - No adapter remains: `assemblyAdapter` is removed, and `restoreCommand` now restores only the historical `proofHarness`.
   - The two remaining `str.replace` uses (`final_prepared_specs`) are guarded by occurrence-count assertions and roundtrip reconstruction. The report is generated from data.
4. **Alias check: pass.** `alias_paths()` now reads the effective move-set old paths (1,559; the three retained roots excluded). The matrix reports 51 writer rows (7 parked, 17 preserved, 27 rejected) and 0 violations. This matches my independent count.
5. **Owners: pass.** All 180 parks are listed in `effectiveParkOwners`, with unique ids and 18 distinct real owners. Owners are mapped per family: Knowledge-registry, Work-state, Runner, Git/ScopedCommit, Gateway/CTR010, Component-boundary, Decision-index/area mapping, Ratchet/replacement-guard, Documentation-governance and others. Only `dynamic-023895` names the Lead, for the placement decision.

## Conservation and readiness

- 46,404 rows; 0 missing; 0 duplicates.
- Classes: 0 applied-safe / 422 prepared / 9,611 preserved / 180 parked / 36,191 rejected.
- Family accounting is unchanged: 2,311 members, 2,131 flips. v1 `v1ApplicationSha256` and the 214 v2 reevaluations are intact.
- 214 patch specs. 602 blocked readiness rows (= 422 + 180). `readyForCutover: false`, `noReadinessClaim: true`.

## Lead questions

1. R2-F2: do the 7 `AGENTS.md` root pointers belong to the AGENTS/A34 packet (record it on the rows), or should they flip like r18863?
2. R2-F1: approve flipping the 10 pointer rows, and tying the 2 manifest rows to the architecture-map park, together with the premise-test fix to the proof?

Status: DONE_WITH_CONCERNS
Summary: Rework (narrow). The 39 overturns, composed patch roundtrips, single-command byte-identical replay, move-set alias check and owner split all pass. 12 live pointers are still preserved on a "retained" premise the move set contradicts (siblings of rows patched this turn), and 7 AGENTS.md root pointers need a Lead ruling.
