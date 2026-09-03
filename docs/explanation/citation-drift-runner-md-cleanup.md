---
authoritative_for: citation-format cleanup applied to docs/specs/runner.md
---

# `docs/specs/runner.md`'s citation-format cleanup

`tsk-2sp-2` applied the same citation-format fix contract to
`docs/specs/runner.md` (412 findings — the largest single file in
`tsk-2sp`'s narrowed scope) that `tsk-2sp-1`/`tsk-2sp-5` applied to
`docs/specs/work-state.md` and the remaining spec docs: `bare-citation`
findings get a one-line gloss, `d-local-outside-home` findings get their
`D<n>` id deleted (with content inlined where the surrounding text wasn't
already self-sufficient). See `docs/how-to/fix-bare-citation-findings.md`
and `docs/how-to/fix-d-local-outside-home-findings.md` for the fix
technique itself, and
`docs/explanation/citation-baseline-cleanup-calibration-slice.md` for why
this backlog was split by file and by finding kind rather than fixed in
one pass. No new technique or finding emerged from this file specifically
— it's recorded here so this item's own capture has a linked doc per the
knowledge registry's own producer contract, distinct from `tsk-2sp-1`'s
and `tsk-2sp-5`'s own capture records.
