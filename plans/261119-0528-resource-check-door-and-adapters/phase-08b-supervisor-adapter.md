# Phase 8b: Supervisor adapter and the honest phase-table reader

> This phase belongs to the door plan `plans/261119-0528-resource-check-door-and-adapters`. Phases 1 to 7 and 7c are in plan A (`plans/261119-0030-resource-referee-graph-write-scope-stack`), whose decisions 1 to 31 apply.

## Inputs

- The set-level function and the error policy of plan A (phases 1 and 3), and plan A decision 31.
- `packages/supervision/rust/src/portfolio.rs` (`plain` at line 317 strips backticks and every `*`; `read_phase_table` turns a non-integer wave into `None` at line 384, keeps a duplicate id, and drops non-string frontmatter entries at lines 121-129; `normalize`, `overlaps`, `admissible`, their tests) and its doc comment saying the rule equals the JS copy. Nothing outside the crate's tests calls `admissible`, `overlaps` or `read_plan` today, and the draft plan `261118-1045-project-supervisor` owns the design of the crate.
- `packages/supervision/rust/src/land.rs`, which already calls `fgos_write_scope` (the pattern to follow).

## Files it may write

`packages/supervision/rust/**` only. The manifest of this crate was edited in plan A's phase 2.

## Steps

0. Step zero of plan A decision 24, then tell the `project-supervisor` lane which file this phase changes and that it must not be promoted while this plan runs.
1. Fix the footprint-cell reader first (decision 31): keep every `*`, strip only the backticks and link syntax around a whole entry; refuse, with a named code, a wave that is not an integer from 1, a duplicate id, a missing column and a non-string frontmatter entry. Give each refusal an owning case, including `apps/fgos/tests/questions_*.rs` surviving as written.
2. Before swapping the rule, write a table of old-versus-new cases for `portfolio.rs::overlaps`, including the glob-cut cases the old rule gets differently (`apps/fgos/tests/questions_*.rs` against `apps/fgos/tests/supervision_*.rs`), `src/**`, a bare `*`, an empty entry, an empty footprint list, `.`, `..`, an absolute path, a backslash and a trailing slash. Run it against the old function and record the outcomes.
3. Replace `overlaps` and `normalize` with calls to `fgos-write-scope`; keep `admissible` and its public signature. Add a small `footprint_problem(plan)` function that returns the named reason (`footprint-entry-invalid`, `footprint-empty`) and have `admissible` call it, so a plan with a bad or empty footprint is not admissible, never a panic and never disjoint, and no other plan is affected (plan A decision 17). `admissible` compares one pair at a time, so it cannot truncate and gets no `facts-truncated` path.
4. Delete the old function and the comment that says the rule is kept equal to the JS copy. List every divergence from the old outcomes for the CHANGELOG (phase 9 writes it, noting that admission is not wired to a running door).
5. Tests: the table above, one adapter case for the malformed entry and one for the empty footprint with their reasons, and one case proving `admissible` still excludes a plan overlapping a running one. The owning test of the overlap behaviour stays in plan A's `write-scope`.
6. List the census entries this phase changed against its footprint.

## Verify

`cargo test -p fgos-supervision` and `rg "fn overlaps" packages/supervision` finds nothing.

## Rollback

Restore the deleted function and the old reader from git.
