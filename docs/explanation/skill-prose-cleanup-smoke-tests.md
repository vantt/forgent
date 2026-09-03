---
authoritative_for: tsk-56w's smoke-test QA pass, per-skill throwaway chores, smoke-tsk-56w-* items
---

# `tsk-56w`'s smoke-test QA pass

Per `tsk-56w`'s D5 QA process (see
`docs/explanation/skill-prose-cleanup-design.md`), each skill-split child
task was followed by a genuinely throwaway `chore` work item
(`kind: chore`, `verify: "true"`, a no-op) claimed through the normal
`fgos pick`/claim flow specifically to exercise the just-edited skill end
to end at least once — proving it still *runs* correctly (not just that
its file structure looks right, which `verify` alone can't prove).

Items covering this pass: `smoke-tsk-56w-1` (`fgos-coding-driving`),
`smoke-tsk-56w-2-child`/`smoke-tsk-56w-2-parent` (`fgos-fanout`, needing
both a parent and a child item to exercise fan-out's own claim shape),
`smoke-tsk-56w-3` (`fgos-coding-exploring`), `smoke-tsk-56w-4`
(`fgos-coding-planning`), `smoke-tsk-56w-5` (`fgos-coding-validating`),
`smoke-tsk-56w-6` (`fgos-coding-implement`), `smoke-tsk-56w-9` (the
remaining bare-citation skills — `fgos-routing`, `approve`, `pick`). Each
completed cleanly through its normal claim flow, confirming the split
skill still functions as intended. This one doc covers every smoke-test
item's own capture — no per-item content beyond what's recorded here.
