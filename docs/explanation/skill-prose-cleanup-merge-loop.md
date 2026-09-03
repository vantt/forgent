---
authoritative_for: merge-loop SKILL.md/references split (tsk-56w-7)
---

# `merge-loop`'s skill-prose cleanup

`tsk-56w-7` applied `tsk-56w`'s design (see
`docs/explanation/skill-prose-cleanup-design.md`) to `merge-loop`
(437 lines): split into `SKILL.md` + `references/*.md`, removed every
bare governance-id citation per D1's product/shippable rule. `merge-loop`
is a CLI-wrapper skill with no mirrored copy under `plugins/fgOS/skills`
(per `tsk-56w`'s own note that only the 6 core dev-skills need the
`.agents/skills` ↔ `plugins/fgOS/skills` diff-empty positive check), so
this split only needed to land at its one real location. No other new
technique or finding beyond the parent design doc — recorded here so this
item's own capture has its own linked doc.
