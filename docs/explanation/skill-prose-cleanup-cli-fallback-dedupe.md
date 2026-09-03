---
authoritative_for: 23 skill CLI-wrapper boilerplate consolidated into plugins/fgOS/skills/_shared/fgos-cli-fallback.md (tsk-56w-8)
---

# Deduplicating the "fgos CLI fallback" boilerplate across 23 skills

`tsk-56w-8` closed the second defect `tsk-56w` set out to fix (see
`docs/explanation/skill-prose-cleanup-design.md`): 23 skill CLI-wrapper
files under `plugins/fgOS/skills` each repeated the identical 9-line bash
block calling the `fgos` CLI as a fallback. Consolidated into
`plugins/fgOS/skills/_shared/fgos-cli-fallback.md`, and each of the 23
wrapper files now points at that shared file instead of carrying its own
copy — the same precedent `_shared/citation-format.md` had already
established for shared skill fragments.
