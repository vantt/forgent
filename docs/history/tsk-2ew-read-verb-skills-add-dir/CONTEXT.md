# CONTEXT: read-verb plugin skills silently see an empty backlog from a worktree

Item: `tsk-2ew`. Written retroactively (same structural gap as this scan's
other items).

## Locked decisions

- **D0.** Root cause confirmed: `grep -c -- "--dir"` on all 10
  `plugins/fgOS/skills/{list,ready,triage,show,stale,rollup,graph,check,
  conflicts,merge-list}/SKILL.md` returns 0 for every file. Every one of
  the 13 write-verb skills (`pick`, `discover`, `decompose`, ...) already
  passes `--dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"`
  on every `fgos <verb>` call — the split is exactly read vs write.
  Worktrees never carry their own `.fgos/` (ADR0020); without `--dir`, a
  read-verb call from inside a worktree resolves against a non-existent
  local store and returns an empty result with exit 0, no error on stdout
  (the CLI's own warning goes to stderr, which these skills never surface).
- **D1.** Fix: mirror the exact `--dir` pattern already used by every
  write-verb skill (`pick/SKILL.md` cited as the canonical example) onto
  every `node "$FGOS_BIN" <verb> ...` and its paired `fgos <verb> ...`
  PATH-fallback line, across all 10 files.
- **D2.** No `.agents/skills/**` mirror needed here (unlike `.claude/
  skills/fgos-*`): confirmed `.agents/skills/` has no `list`/`ready`/
  `triage`/etc. entries at all — the mirror requirement is scoped to
  `.claude/skills/**` only, and these 10 files live under
  `plugins/fgOS/skills/**`, a separate tree with no `.agents` counterpart.
- **D3.** `list/SKILL.md`'s own closing line ("If `data.work` is empty, say
  so plainly — an empty result is valid, not a failure") stays untouched —
  it's correct prose for the case it was written for (a genuinely empty
  backlog when running with a working `--dir`); the bug was never in that
  sentence, only in the missing flag that made an empty backlog the WRONG
  answer look identical to the right one.

## Outstanding questions

None
