---
authoritative_for: fgos-coding-implement SKILL.md/references split (tsk-56w-6)
---

# `fgos-coding-implement`'s skill-prose cleanup

`tsk-56w-6` applied `tsk-56w`'s design (see
`docs/explanation/skill-prose-cleanup-design.md`) to `fgos-coding-implement`
(436 lines): split into `SKILL.md` + `references/*.md`, removed every
bare governance-id citation per D1's product/shippable rule. This split
used the already-installed `~/.claude/skills/cook/` skill as its real
structural template (per `tsk-56w`'s own DISCUSSION.md §"Nguồn tham khảo"
— `cook` is a real, already-in-the-repo example of the `SKILL.md` +
`references/*.md` shape for a skill of comparable size/role, used instead
of inventing a shape from scratch). No other new technique or finding
beyond the parent design doc — recorded here so this item's own capture
has its own linked doc.
