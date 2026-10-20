# Review a38 — step 4 wave 2, part 34 (set step04-024, runner/dispatch comments)

Pin dc24ce645 (authorInputCommit). All three sources read whole-file regions around every edge plus a full `docs/` / `plans/` / `.md` grep of each file for missed references. All three records have an empty diff (no patch slots), so no behavior-change risk. `stepFiveExcluded` is `[]` in all three; grep found no runtime strings that cite docs.

## Per-file verdicts

### src/runner/dispatch/resolve.mjs — set step04-024, stratum mandatory (part sample) — verdict ok
Slots reviewed: 5 slot rows (class6-l-000275 x2 lines 9/10, -000276, -000277, -000278), all preserve.
- 000275: `docs/history/dispatch-activation-and-handoff-redesign/ CONTEXT.md` (lines 9-10). The directory exists under docs/history and docs/history is retained (L12-10). Preserve is correct.
- 000276: `docs/decisions/0033-...md` (line 275). It is a literal ellipsis example. The record carries a non-executable successor note to `docs/platform/runner/decisions/h-36d872fbb0e5.md`. The file exists and has `### 0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess…` at L1211. Title match is correct.
- 000277 / 000278: `docs/history/` (line 275 continued as `capability-capacity-remodel/CONTEXT.md`) and `docs/history/capability-` (line 290, continued as `capacity-remodel/CONTEXT.md`). The directory exists. Preserve is correct.
Missed references: none. Line 248 `this item's own CONTEXT.md` is a bare filename, not an edge.

### src/runner/dispatch/run-lock.mjs — set step04-024 — verdict REWORK
Slots reviewed: 1 (class6-l-000279, parked).
- OUTCOME DEFECT, class6-l-000279, source line 5: `// docs/architect/agent-coordination/architecture/runtime-recovery-design.md`. The slot is `parked` as a "Phase 9 carry". Rule: before accepting a `parked` slot, check for a LIVE non-carriage holder of the same passage in docs/platform/**. One exists, so the slot must be a Phase 9 patch (L12-30).
  - Live holder: `docs/platform/agent-coordination/architecture/runtime-recovery-design.md` (non-history path, same file name, same-path mirror prefix per L12-58/Step 2 disposition rule "directory references with a same-path docs/platform mirror take the mirror prefix").
  - It has `## 6. Local Concurrency And Durability` at L125. That is exactly the cited section ("section 6 (\"Local Concurrency And Durability\")" in lines 4-6 of the source).
  - It documents run-lock.mjs itself: it names `src/runner/dispatch/run-lock.mjs`, `buildRunControlHolder` and `resolveHolderLiveness`, and describes the generation records and release markers. The contract the park reason says must be carried is already in the live doc.
  - The park reason says RUL101 addresses a different lock, but that is irrelevant. The target is the design doc, not RUL101.
  - Why the witness missed it: its search used the legacy path string only (`searchWitness.queries[0].query` = the legacy path; `liveHitCount 0`, 4 carriage hits). It never looked for the mirror destination path.
  - Correction: disposition `patch`. Replace line 5 text `docs/architect/agent-coordination/architecture/runtime-recovery-design.md` with `docs/platform/agent-coordination/architecture/runtime-recovery-design.md`, a comment-only edit (no code change). Anchor: line 5, columns 4-77. Section 6 wording on line 6 stays valid.
  - Check the line-5 comment stays well formed after the longer path. It is a `//` comment, so there is no behavior change.
- Missed references: line 3 `plans/260911-2305-runtime-recovery/phase-designs/run-admission-and-fencing.md` is a dated archived plan (history, L12-60 ruling), so no edge is needed. This is not a defect.

### src/runner/loop.mjs — set step04-024 — verdict ok
Slots reviewed: 5 slot rows (class6-l-000290 line 143; -000291 lines 1349/1350; -000292 lines 1631/1632), all preserve.
- `docs/history/orchestrator-worker-slots/DISCUSSION.md` (143-144), `docs/history/fanout-and-delegation-rubric/CONTEXT.md` (1349-1350) and `docs/history/orchestrator-worker-slots/plan.md` (1631-1632). All three directories exist and carry the cited files. Preserve is correct under L12-10.
- The other grep hits (`plan.md`, `CONTEXT.md`, `gate-auto-approve-mechanics.md`, `RESEARCH.md`, 1551-1565 runtime `path.join(..., 'plan.md')`) are bare filenames or runtime code, not edges. The Step 5 exclusion list is empty and nothing needed adding.

## Record-text notes (not rework)
- 000275/000277/000278: the `matchedExpression` only covers the `docs/history/` prefix on some wrapped spans. That is harmless for preserve.
- run-lock.mjs park text: after correction, replace the "Carry the exact admission/fencing contract" wording with the patch rationale and cite the live holder.

## Lead-judgment questions
- None beyond the run-lock.mjs finding.

## Counts
- Set step04-024, mandatory stratum: 3 files reviewed, 1 rework (run-lock.mjs). 1/3 = 33% > 3%, so the set expands to every file. All three files were reviewed here, so the expansion is covered for this part.
- Slots: 11 reviewed (10 preserve, 1 parked->patch needed).

Status: DONE
