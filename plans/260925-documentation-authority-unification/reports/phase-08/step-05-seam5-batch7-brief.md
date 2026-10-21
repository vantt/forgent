# Step 5 seam 5 — batch 7: deferred replay rule and the last 264 files (Doer brief)

Status: Lead brief for the next Doer turn (records only).

You are Doer for Phase 8 of plan 260925-documentation-authority-unification in the fgOS repo. Batch 6 (committed by the Lead as 1b9fce325 after your correct exit-13 stop) authored 100 files; the checker has four j6-r22-replay failures because the owning tests of four patched files create git/state fixtures or invoke the fgos CLI, which the records-only scope forbids (step-05-seam5-batch6-replay-blockers.json). 264 files remain (zero literal references, 10,529 tuples). All rules of the seam 5 briefs (R17–R24, L12-76..L12-81) apply. Same write scope and prohibitions as before: records only under plans/260925-documentation-authority-unification/reports/phase-08/, never a git write, never the fgos CLI, never the .fgos directory or the secrets env file, python -B, scratch /tmp/fgos-work/, tests with env -u CLAUDE_CODE_SESSION_ID, progress.md early and at the end.

## Lead ruling R25 (record as L12-82 with counts)

When the R22 current/candidate replay of a patched test file needs git fixtures, state fixtures or the fgos CLI, the replay obligation moves to the Phase 9 cutover proof: record the exact owning test command, the asserted lines whose output changes, the expected before/after strings, the full forward/inverse diffs and the co-cut set, with status replay-deferred-phase9. The checker accepts that status only when every one of those fields is present and the diff applies to the pinned bytes; add a rejecting probe for a deferred replay missing any field. Replays that can run in pure scratch (no git, no CLI, no .fgos) still run now.

## Work

1. Apply R25 to the four blocked files; full checker 0 failures; every probe (including the prompt probes that refused to run) rejects.
2. Author the remaining 264 files: apply R21/R20 neutrality first (most have no literal reference), then judgment records for the rest, all of them if they fit, in the existing order.
3. Update continuation (expect empty or near-empty) and the review list (addedThisTurn; changedThisTurn split into dispositionChanged vs labelOnly).
4. If seam 5 is complete, write step-05-seam5-closure.json: totals (files, references, tuples; mechanical, neutral, judgment; admitted, rejected; parks, patches, preserves; deferred replays), the park dependency list grouped by dependency, and the patch/co-cut unit list for Step 7.

Final message: FIRST line a conventional commit subject (at most 100 chars, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em): R25 result, files closed (neutral/judgment), remaining, seam 5 totals if complete, checker/probes.
