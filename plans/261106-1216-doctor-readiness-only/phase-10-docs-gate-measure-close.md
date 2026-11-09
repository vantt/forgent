---
phase: 10
title: "Docs gate, decision narrative, final measure, close and owner-machine guide"
status: completed
depends_on: [01, 02, 03, 04, 05, 06, 07, 08]
parallel: "none; P09's WORK part may still be open (named on the board)"
owning_lane: "HARDEN (reviewer: DOC)"
effort: ~0.5d
net_size: "Node 0 / Rust 0 / tests 0 (docs only)"
---

# Phase 10 — Docs gate, measure, close

## Context

Audit §3 proposed gate wording; decision 65 accepted shape §3. Text read on `fd476d709`:

- `AGENTS.md:129-147` "Install/setup/doctor gate": "a config default, env var, or infra dependency … must register into `fgos setup`'s config-merge and `fgos doctor`'s check registry (`src/setup/checks.mjs`)". `fgos setup` is deprecated and config defaults are no longer registered (registry contract §1); the gate never said where incidents or repo rules go.
- `docs/platform/packaging-distribution/spec.md:41,49-51,155-171,551-552,665-694` (doctor rows, RUL9, RUL11, data dictionary #7/#7b).
- `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` §1 (`:28-34`), §3 (`:47-94`), §6 (`:118-120`), inventory (`:136-146`).
- AGENTS.md carries an uncommitted AgentKit block on the owner machine (memory: save and re-apply around every pull); the edit lands from a linked worktree on `origin/main`, never from the shared checkout's working tree.

## Requirements

- **AGENTS.md gate** replaced by the audit §3 wording, adapted to the verbs that now exist: "A new config key goes into `core/config-standard` and `core/config-schema`. A new runtime dependency (tool, file, directory, platform capability) needs a readiness row in doctor (`src/setup/registrations.mjs`). A new runtime state or incident class must be reportable and repairable through its component's own verb, never only through doctor; doctor may carry one read-only pointer row for it. A rule about the fgOS repo's own files goes into `npm test`, CI, pre-commit or the release check, never into doctor." Keep the install-level and CHANGELOG bullets. Regenerate the instruction projection (`npm run build:skills`, P03) so the managed block stays current.
- **Packaging-distribution spec**: one business rule stating doctor's question (readiness only; `--fix` repairs readiness only; pointer rows; where incidents and repo rules go), placed beside RUL9/RUL11 with a new rule id from the spec's own numbering; data dictionary #7/#7b text; `:41,49-51,155-171` match. **Decision narrative** in the spec's "Lịch sử quyết định" (holder resolved through `docs/platform/governance.md#decision-scope-to-holder-table`): owner decision 65 (2026-11-06), what moved where, the two choices made in this plan (recovery in `fgos init`, terminal section in `dispatch inspect`). If the holder table requires a `D-ADR` number, mint it with `fgos identity mint d-adr` (network needed; fails clearly without).
- **Registry contract**: §1 purpose ("environment readiness" plus the pointer rule; `fgctl init` tail unchanged, `fgos init` recovers Git operations); §3 doctor contract (pointer rows warn, never fail, never fix; "Owning proofs outside doctor" list from P03/P05); §6 ownership boundary; inventory lines final.
- **Final table** in the close report: every audit §1 row → kept / pointer / moved (to which test or verb) / deleted / T5 / WORK, and the final row id list (≤ 112 after P08).
- **Measure** on fg-server2 with the activated release: `fgos doctor --json` median of 3 (target ≤ 20 s); scratch non-fgOS repo (no `.fgos`, no child, ≤ 4.5 s); per-row times with the audit's preload wrapper for the ten slowest rows. Record the ≤ 12 s target as pending on the board until P09 (WORK) and T5's seat-row cut land; re-measure then.
- **Backlog**: one row for retiring `shell-integration-sourced` when the `fgos setup` fallback window closes (audit §1), if none exists (`rg -n "shell-integration" docs/backlog.md`); id from `fgos identity mint backlog`.
- **Board**: HARDEN row and `log.md` line (land, numbers); WORK row carries P09.
- **Owner-machine guide** (Vietnamese) complete: per phase main commit, user-visible change, commands (pull, build/stage/activate, `fgos doctor`, `fgos git status`, `fgos knowledge status`, `fgos lock-status`, `fgos dispatch inspect --terminal`), expected rows, rollback.
- `CHANGELOG.md`: one summary line if the per-phase lines do not already say "doctor answers readiness only".

## Files

**Create:** close report and guide under `plans/reports/` (names from `fgos convention name`).

**Modify:** `AGENTS.md:129-147`, `docs/platform/packaging-distribution/spec.md`, `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`, `docs/backlog.md` (one row, if needed), `docs/decisions` projection (`fgos decision-index`) if a D-ADR is added, `CHANGELOG.md`, this plan's `plan.md` status (through `ak plan`), the program board row and `log.md`.

**Delete:** none.

**Tests to retire:** none.

## Net size

Docs only.

## Validation

- FR `test/scripts/doc-health.test.mjs test/scripts/check-decision-citation-drift.test.mjs test/setup/registrations.test.mjs` + the instruction-projection repo case (P03)
- `fgos decision-index --check` clean if a D-ADR was added
- Measurements above recorded in the close report

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| The owner machine's uncommitted AGENTS.md block conflicts on pull | M × L | Guide step: save the block, pull, re-apply (memory rule) |
| A spec line cites a row id that no longer exists | M × L | citation-drift test; id grep over `docs/platform` |

## Rollback

Revert the docs commit. No code or format change.

## Done when

Gate text, spec rule, decision narrative and registry contract match the code; measurements recorded; board and guide complete; plan status set through `ak plan`.

## Lead brief essentials

Edit AGENTS.md only in a linked worktree from `origin/main`. Measure with the activated release, not the dev host. All plan.md lead rules apply.
