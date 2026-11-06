---
phase: 13
title: "Close: Part A shapes and every settled fact into the area specs, backlog rows and hand-offs recorded, re-measure against the baseline, closing report, owner-machine guide complete"
status: pending
depends_on: [01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12]
parallel: "none"
effort: ~1d
net_size: "0 / 0 / 0"
---

# Phase 13 — Spec, hand-off, close, land

## Context

Per-layer loop steps 2 (the settled Part A shape is written into each component's spec), 7 (land), 8 (re-measure) and 9 (close) in the [HARDEN plan](../261021-1118-harden-low-layers-bottom-up/plan.md#the-per-layer-loop). `docs/` is not frozen any more (DOC Phase 9/10 landed); phases wrote the spec line of their own behaviour where they could; this phase writes the rest and checks all of them. Baseline: [research-261104-1755](../reports/research-261104-1755-harden-t5-baseline.md) (main `af19e6de6`, fg-server2). If P04's command half still waits on UQ-1, this phase closes the rest and leaves that line open on the board.

## Requirements

- **Spec lines** (each with the commit that made it true; DOC lead told before the merge, board shared-file rule):

| File | Change | From |
|---|---|---|
| `docs/platform/runner/spec.md` | Part A shapes for Execution Core and Dispatch with Node budgets (§2 of the arbitration); the hostile-input rule stated once: every host read of an agent-writable or pulled file goes through `readAgentFileSync` (no-follow, non-blocking, regular file, capped); recover actions without `resume-driver`/`reassign-driver`; liveness from the attempt lock; B-7 closed signal | 02, 07, 09, 10 |
| `docs/platform/agent-confinement/spec.md` | §3.2 non-goal `:123` becomes "the attempt sees only its own login" (decision 61 Q3b); §9.3 `:516` lists the login-store masks and keeps abstract sockets and localhost as unmasked (A6 backlog `p-x4qeqdvfl5`); host-only record and held-home settle; probe gate on write-back; failure-path finalize | 03, 06 |
| `docs/platform/seat-binding/spec.md` | Node facade budget (`bind.mjs` ≤ 520), golden as the owning proof, one `askFor` for run and dry bind | 10, 12 |
| `docs/platform/config/spec.md` | merge value `tighten`; `confinementPolicies` global-only; command/args scope per UQ-1; runner type rules owned by the schema | 04, 11 |
| `docs/platform/agent-coordination/architecture/evidence-and-results.md` (Run Result row target) | one derivation in Rust through the addon; one written version V3 | 08 |
| `docs/platform/run-supervisor/spec.md` | layer moves (`run-lock`, `cwd-lock`, `dispatch-error`, `worker-artifacts`, `stray-writes`, `trust-store` now under `src/run-supervisor`); intent `terminal` field; claude private store per attempt | 02, 05, 06 |
| `docs/platform/process/spec.md`, `docs/platform/component-boundary.md` | `process-identity` path under `src/native`; Run Result, Dispatch, Execution Core, Seat Binding rows with budgets; addon links `fgos-run-result` (Git row) | 02, 08 |
| `docs/platform/terminal-control/spec.md` (or the herdr adapter spec the lead finds) | `worker-session-boot.mjs` is the one raw `herdr server` call, guarded per session (H-T5e) | 07 |
| decision history ("Lịch sử quyết định" of runner, agent-confinement, config specs; resolve holders via `docs/platform/governance.md#decision-scope-to-holder-table`) | decisions 61 and 62 as settled facts | all |
| `docs/backlog.md` | H-T4c row created and closed (if P05 did not); `p-a189ff31` closed with the red-team's confined read as evidence; `p-8da4b370` gets R-3 attached and the half Q2b closed; `p-3e6b1a52` closed or annotated (P10 finding); new rows H-T5b (S-6 refresh-ahead on the launch path; `.fgos/assignments` retention for Workflow); `tsk-p7-shadow-binders` already done | all |

- **Re-measure** (loop step 8) on fg-server2 on the activated release, same load class as the baseline (state load average): Node lines per component vs §2 budgets (`wc -l`), function-length scan (no function over 300), Rust lines; the layer's Node test set count and time (batch and file by file), the failover and run test files; doctor row count and per-row time for the layer's rows; seat host spawns per doctor; `dispatch inspect --cwd .`; one direct and one pane seat launch time. Before/after table in the closing report.
- **Net size** per language of every HARDEN T5 commit (landed batches plus P02–P12; Rust test code counted as tests) against plan.md's budget.
- **Hand-offs:** H-T5a to TEST and H-T5c to WORK confirmed on the board by the receivers (owner decision 8); H-T5d note to ES; H-T5f in the guide.
- **Closing report** `plans/reports/closing-<date>-harden-t5-execution-core.md` (name from `fgos convention name`): landed hashes per phase, open items (UQ-1 if still open), measured table, received items answered (each item of the layer phase file's "Received" list with its phase or reason).
- **Owner-machine guide** complete (Vietnamese, one section per landed phase, rollback lines, the census steps before P04/P11), linked from the board.
- Layer phase file `phase-06-t5-execution-core-dispatch-seat-run-result.md` and the HARDEN plan's phase row updated by the big lead (not by a lead); board HARDEN row and one `log.md` line.

## Files

**Create:** the closing report and the guide (under `plans/reports/`).

**Modify:** the spec, boundary and backlog lines above; `CHANGELOG.md` only if a phase missed a user-visible line.

**Delete:** each phase's private Cargo target and retired worktrees (after `CACHEDIR.TAG` check, literal paths).

**Tests to retire:** none.

## Net size

0 / 0 / 0 (docs only).

## Steps

1. Collect phase reports; build the spec-line list with commits.
2. Write the lines; doc-health and citation drift; tell the DOC lead.
3. Re-measure; net size; closing report.
4. Guide complete; board; layer phase file.

## Validation (focused)

- FR `test/scripts/doc-health.test.mjs test/scripts/check-decision-citation-drift.test.mjs`.
- `fgos convention check` on changed docs.
- Every acceptance criterion of plan.md checked and quoted with its command output in the closing report.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| Spec lines drift from code because phases landed over a week | M × M | Each line cites its commit; doc-health and citation drift run. |
| UQ-1 still open at close | M × L | Close with that line open on the board, as T0–T4 closed with their open hand-offs. |

## Rollback

Docs-only: revert the commit.

## Done when

All acceptance criteria quoted with evidence; closing report and guide written; board updated; layer phase file marked by the big lead.

## Lead brief essentials

Cite a commit for every spec line; measure on the same machine and load class as the baseline. All plan.md lead rules apply.
