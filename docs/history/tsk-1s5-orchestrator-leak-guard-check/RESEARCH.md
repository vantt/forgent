# RESEARCH — tsk-1s5

## Round 1 (2026-08-11)

**Asked:** where exactly does the pinned term "orchestrator" leak into
`docs/history/fgos-coding-driving-item-display/CONTEXT.md`, what does
`test/docs/launcher-vocabulary-guard.test.mjs` check, and what is the
correct replacement — item claims the failure is confirmed pre-existing
at commit `725c292a` (before tsk-107), unrelated to `merge.mjs`.

**Checked:**
- `git grep -in orchestrator docs/history/fgos-coding-driving-item-display/CONTEXT.md`
  → one hit, line 133: `` - `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md` `` —
  a citation of decision 0026's own (frozen, never-renamed) filename.
- `test/docs/launcher-vocabulary-guard.test.mjs` (full read) — the NEGATIVE
  test walks every tracked file, strips known frozen filenames/phrases
  (including exactly `0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn`,
  wrap-tolerant), then asserts no bare `orchestrator` remains outside the
  allowlist.
- `git show 725c292a:docs/history/fgos-coding-driving-item-display/CONTEXT.md`
  line ~133 — at that commit the citation read
  `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`
  verbatim too, but this did NOT match the frozen-filename strip at that
  point in history (the strip pattern or the line's exact text differed
  enough to leak past it) — confirms the item's own "confirmed pre-existing
  at 725c292a" claim.
- `git log --oneline -- docs/history/fgos-coding-driving-item-display/CONTEXT.md`
  → most recent commit touching this file is `10c0bed5 fix: pin "launcher"
  not "orchestrator", resync .agents/skills mirror` (2026-08-11 13:07:18
  +0700), which already fixes exactly this leak (2-line diff:
  `.agents/skills/fgos-coding-driving/SKILL.md` +
  `docs/history/fgos-coding-driving-item-display/CONTEXT.md`).
- `git merge-base --is-ancestor 10c0bed5 HEAD` on this item's own worktree
  branch (`fgw/tsk-1s5`, based on main `6210aa1f`) → **true**: the fix is
  already merged into main, ancestor of this worktree's own base.
- Ran `node --test test/docs/launcher-vocabulary-guard.test.mjs` on this
  worktree right now → **10/10 pass**, including the NEGATIVE guard test.

**Found:** the bug this item reports is real and was real at `725c292a`,
exactly as the item's own description states — but it was independently
fixed by commit `10c0bed5` (a different, unrelated session's post-merge
verify fix) before this item was ever claimed. That fix is already an
ancestor of `main` and therefore already in this item's own worktree base.
There is nothing left to change in the codebase for this item's stated
goal — the fix already exists and the verify command already passes.

**Still open:** none — the technical question is fully resolved. What
remains is process only (how `fgos-coding-planning`/`fgos-coding-implement` want to
handle an item whose fix already landed via a different path), which is
outside this skill's remit.

**Verdict:** clear. `verify: "node --test test/docs/launcher-vocabulary-guard.test.mjs"`
(already passes on this worktree, confirming the fix is already in place).
