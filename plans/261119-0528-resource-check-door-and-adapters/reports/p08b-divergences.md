# Phase 8b: supervisor admission divergences from the removed `overlaps` (input to the phase 9 CHANGELOG)

Admission (`admissible`) is not wired to a running door (only `supervisor::plans` and `wake` read it).

- Two globs in one directory (`questions_*.rs` vs `supervision_*.rs`), `src/a*` vs `src/ab/x`, `src/a*/x` vs `src/b/x` now overlap; the old rule cut at the first `*` and called them disjoint.
- An empty footprint list is refused as `footprint-empty` and the plan is not admissible (was: no overlap).
- An entry that is empty, `.`, `..`, absolute, has a backslash, or is like `ab**` makes the plan not admissible as `footprint-entry-invalid` (was: compared after normalization; `.`/empty overlapped everything).
- A running plan with an uncomparable footprint no longer holds other plans back (plan A decision 17).
- Reader: phase footprint cells keep every `*` (was stripped: `src/**` became `src/`).
- Reader: a malformed table (non-integer or zero wave, duplicate id, missing column, empty or ambiguous table) or a non-string or non-list frontmatter entry is refused by name; before, these were dropped or defaulted. `Phase.wave` is `u32`, no longer `Option<u32>`.
