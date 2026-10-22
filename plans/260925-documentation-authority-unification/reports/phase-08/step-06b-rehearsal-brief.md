# Step 6b rehearsal: the documentation-cutover lease on a disposable clone (Doer brief)

Status: Lead brief. Owner decision 6: rehearse acquire, a refused commit, a refused dispatch, a refused merge, abandon and release on a throwaway copy before the real cutover, as the acceptance test of the lease. L12-92: no real lease on this repository.

You are Doer for Phase 8 of plan 260925-documentation-authority-unification in the fgOS repo. Run the rehearsal against a DISPOSABLE repository only: `git clone --no-hardlinks` this plan worktree's current HEAD into `/tmp/fgos-work/lease-rehearsal/repo` (make its `main` branch point at the cloned HEAD, wire its hooks with the repository's own setup command or `git config core.hooksPath .githooks`, and add one linked worktree `/tmp/fgos-work/lease-rehearsal/holder` and one `/tmp/fgos-work/lease-rehearsal/other`). Use the plan worktree's code (`node <plan worktree>/bin/fgos.mjs …` with `FGOS_HOST_BIN=/home/vantt/.local/state/fgos/releases/sha256:9508f457d1ec11814de34149c6b19ce01ffbf237060ee6093fbaf442fac4b511/bin/fgos` and cwd inside the clone), never the installed `fgos` and never against this repository or its `.fgos/`. If the CLI needs the clone activated, use the repository's own documented dev path for a scratch project and say exactly what you did.

Rehearse in order, capturing every command, exit code and the relevant stdout/stderr lines (redact nothing secret; the token must never appear — prove it does not):
1. `docs-lease status` (free) and doctor row (not applicable / ok).
2. `docs-lease acquire --worktree <holder>` → held sidecar committed on the clone's main (show `git log -1 main`, sidecar content without token).
3. Refused: a non-holder commit touching `docs/` in `other` (pre-commit), the same with `--no-verify` then `update-ref` of main (reference-transaction), a non-holder `fgos run` read-only unit (dispatch refusal before side effects), a non-holder land/merge of a scoped branch through the runner land door, and a caller from an unrelated `git init` repository.
4. Allowed: an out-of-scope commit by a non-holder, a holder commit in `holder`, the holder's land of a scoped change through the land door.
5. `docs-lease release` from the holder → released sidecar with digests and drift report.
6. Acquire again, then `docs-lease abandon --owner-confirmed --reason "rehearsal"` → abandoned; then acquire succeeds again and release.
7. Rollback proof: after the run, show that the clone's main contains only the expected commits (list them) and that a forced failure path (e.g. a refused land) left no partial state.
Delete `/tmp/fgos-work/lease-rehearsal` at the end.

Write `reports/phase-08/step-06b-rehearsal.md` (concise: table of step → command → expected → actual → pass/fail) and record L12-114 in owner-answers.md. If any step fails, do not fix code: report the failure with the exact output and stop (the Lead routes a fix).

Writable (exact): plans/260925-documentation-authority-unification/reports/phase-08/**. Never a git write in this repository (the clone is fine), never the installed fgos CLI, never this repo's .fgos/ or secrets, never scripts/run-tests.mjs or npm test.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
