# Seat Binding docs, boundary row and errata: phase lead report

Branch `seat-p09`, on top of phase 10 (`bc8ccd4f0`). Nothing pushed, merged or activated.

## 1. What changed

- **`docs/specs/seat-binding.md`**: status implemented (`updated` 2026-10-21); the "today" contrasts in sections 1 to 12 now read "before Seat Binding" (the ones that are still true, such as the `prefer` shape and the tool-executor path, say so); section 13 notes that it is the evidence of the approved draft, the exec cost is now measured (release p95 4.23 ms against the 5.02 ms budget, debug host 6.76 ms outside it, three-seat panel 11.5 ms p50), and what is still unverified; section 15 and 16 updated, with an implementation pointer list (crate, golden contract, route, client, facade, lease, config, doctor rows, budget). No logic restated.
- **Errata, new section 17, each with evidence and the text fixed in place**:
  - E1 section 7.1: reviewed composition is by checker seat; `tester` is a `reviewer`-role seat with a non-verdict posture (`seat-resolver.mjs` `CHECKER_SEATS`).
  - E2 section 10.2: the `shape / synthesis` seat binds xai, not claude, under the "fewest peers of the family" spread rule (phase 01 report section 5).
  - E3 section 9 step 1: the drain predicate (only a live controller blocks; dead pre-seat records, `legacy-run`, no-`execution` records and open workflow runs are info), with the phase 00 counts.
  - E4 section 6: the write gate replays, the receipt is audited at settle, the doctor replay row is gone.
  - E5 section 5.1: a differing `$comment` is reported, not failed; an absent one is not drift.
  - E6: a lease conflict has its own failure code.
  Also corrected: section 9 step 8 (the doctor rows now named), section 9 step 2 (the fence proof).
- **`docs/platform/component-boundary.md`**: the Execution Core row no longer claims "ai làm / model / persona", drops the "planned" sentence and points to Seat Binding; new Seat Binding row (spec section 3 authority sentence, crate, route, client, depends only on `fgos-host-runtime`, agent seats only, account state through the provider-capacity port, no exec under the provider lock). Workflow row unchanged. Plan acceptance criterion 2 reviewed against the row: no JS computes tier, model, executor order, account order or fallback for an agent seat; `bind.mjs` collects `launchView` and `accountView` and asks the route.
- **Pointer edits**: `runner.md` (the rigor to tier section rewritten around the new contract; the data dictionary `tier` row; the D-ADR0072 status and boundary lines; the older decision records are history and untouched), `workflow.md` (the council-lite sketch declares seats instead of `panelist-N`), `work-state.md` (rigor no longer leads to a model), `reading-map.md` (status and source paths), `distribution.md` and the install how-to (the doctor rows: removed two, added `seat-binding-config`, `seat-binding-dry-bind`, `seat-binding-drain`).
- **CHANGELOG `[Unreleased]`**: setup conversion with backup and printed diff, global file untouched, rollback pair; panel/debate need `seats:`; seat-keyed records and the refusal of pre-seat records on resume; lease conflict code, receipt audit, no account inventory in new snapshots, second walker and `fallbackExecutors` removed; doctor rows added and removed; one line replaced where `model-policy-tier-coverage` was described. The lines for `rigorToTier`, rigor, `max-tier-cap`, refused raises and personas were already there.
- **Skill prose sweep**: no `rigorToTier` or `panelist-N` in `core/skills`, `domains` or the rules. One stale name, `resolveTierModel`, in `core/skills/_shared/executor-dispatch-fallback.md`, reworded; `npm run build:skills` regenerated only its two render copies (`.agents`, `plugins`). A handoff comment naming `panelist-2` now says `member-2`. `core/skills/fgos-cook` untouched. `docs/decisions/index.md` needs no regeneration (`fgos decision-index` reports no change).

## 2. Delta lines

Phases 09 to 11 together, against `22d02f15c`: Node src +465 / -314, Rust 0, tests +575 / -124 (phase 11 touches no src or test beyond one comment).

Whole Seat Binding wave against the merge-base with main (`105c73726`), as `git diff` reports it. It also counts the main commits merged into the track, so it overstates the wave; the directories the wave owns are listed separately:

| Part | Added | Removed | Net |
|---|---|---|---|
| Node src (src, bin, scripts, domains) | 4153 | 3376 | +777 |
| of which the runner, setup, workflow, convention, util, run-supervisor and client directories | 4108 | 3294 | +814 |
| Rust: `packages/seat-binding` (crate and golden contract) | 5406 | 0 | +5406 |
| Rust: `apps/fgos` route | 7 | 0 | +7 |
| Tests incl. fixtures | 7313 | 2603 | +4710 (fixtures +2181) |

Node src shrinks in the files that held the old authorities and grows by the new modules (client, resolver, ledger, conversion, doctor rows); the growth is about 80 lines net outside the crate.

## 3. Reviewer notes

- The spec says "implemented" and the CHANGELOG describes the new behaviour; both are true only once the track lands on main (phase 12).
- Main moved 55 commits since the merge-base; the files this phase edits changed on main only in `CHANGELOG.md` (one line). The main-into-track merge and the conversion drift check stay with the big lead.
- Plan criterion 1 grep result: only the allowed hits, plus `session-lead-inline` in `bind.mjs` (the inline lead stays for a unit that configured no candidate at all, by the ranking phase's decision) and the stale test titles in `scripts/check-decision-codes.baseline.json` and generated `mutation-census.v1.json` (not edited: the first is a ratchet that already fails with 374 unrelated findings, the second is written by the release build).
- `fgos convention check --all` lists 91 findings, none under files this wave added or changed.
- Component-boundary check: changed (Seat Binding row, Execution Core row).

## 4. Verification

- Tests run alone: skill, doctrine, wrapper, registration, architecture, handoff-refs and run tests (15 files) all pass; the docs and prepare-release tests pass. `npm test` not run.
- No Rust change in these phases.
