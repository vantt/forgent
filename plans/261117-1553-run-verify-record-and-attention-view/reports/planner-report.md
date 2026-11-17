# Planner report

Phases: 1 verify facts writer (Node), 2 contract + Rust reader, 3 attention reader (Node), all wave 1 and disjoint; 4 attention flags and wiring proof, 5 docs and CHANGELOG (wave 2); 6 integration (wave 3).

Could not verify: (1) `scripts/plan-contract-check.mjs` did not run here (`git-addon-unavailable`); rules applied by reading, HARDEN runs it. (2) That runs of every worktree sit in the main checkout's `.fgos` when the verb is called from a worktree (the assignment paths of this very run say yes; phase 3 step 1 proves it). (3) Which file gives a live run's deadline and idle to Node; phase 3 step 1 scouts it and the plan states the fallback. (4) That `--write-census` is the census regeneration flag (read from the scan script's usage line, not run). (5) Whether any Workflow reader breaks when `verify` becomes an object with `ran:true` (phase 1 step 1 greps readers). (6) The census-listed status of each source file was counted by grep for most files; `docs/*` files are not listed.
Open owner question: one, non-blocking (unit-summary stays v3 with optional `verify`), in plan.md.
Departure from the brief: the verify record goes to unit settlement, unit-summary v3 and the `fgos run` result, not `assignment-run-result` v3, because the verify check is not an assignment attempt and has no run result (reasoning in plan.md).
