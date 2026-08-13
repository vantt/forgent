# tsk-2k0 — RESEARCH.md

## Round 1 (2026-08-13)

**Asked:** Does `.claude/skills/fgos-fanout/SKILL.md` (and its `.agents/`
mirror) anywhere claim or imply that firing up to 5 concurrent
worktree-entering agents is safe? Is the item's own recorded verify
(`npm test && grep -q "worktree" .claude/skills/fgos-fanout/SKILL.md`)
actually meaningful, or does the grep already pass trivially?

**Checked:**
- `.claude/skills/fgos-fanout/SKILL.md` read in full (263 lines). It
  nowhere names the worktree-isolation hazard tsk-1y0/tsk-2k0's own
  decision logs documented today. Worse: it actively **prescribes** the
  exact unsafe pattern —
  - Frontmatter (line 8): "fires a batch of up to 5 Agents each running
    `/fgOS:pick` end to end"
  - Loop, line 200-203: "dispatch one Agent per id, single message,
    running in parallel (the environment's own 'send independent Agent
    calls together' guidance) — each Agent's job is exactly `/fgOS:pick
    <id>`"
  - `/fgOS:pick` stands up and enters a worktree (`EnterWorktree`) as
    part of its own claim step — so this loop, as written, fires N agents
    that each call `EnterWorktree` concurrently, exactly the pattern
    tsk-1y0's decision log reproduced as a session-level flag clobber
    (fresh repro 2026-08-13, 3-way concurrent dispatch of tsk-1av/
    tsk-4rdi/tsk-584: one sibling starved entirely with 6 consecutive
    Write refusals) and tsk-2k0's own decision log reproduced independently
    (silent cwd drift between two concurrently-dispatched drivers).
- `.agents/skills/fgos-fanout/SKILL.md`: `diff` against the `.claude/`
  copy — byte-identical. Both need the same edit.
- `grep -c "worktree" .claude/skills/fgos-fanout/SKILL.md` → **1** (line
  61: "no skipped worktree — the full pick-through-return path a solo
  session would run"). **The item's own recorded verify is already
  trivially true right now, before any fix** — the word appears once,
  unrelated to the hazard. A verdict of `clear` needs a strengthened verify
  that only passes once the actual hazard is named (e.g. grep for a
  distinctive phrase the fix itself introduces), not the current
  bare-word check.
- `npm test` baseline on this branch (forked from main tip `3fa76828`,
  same commit `tsk-5zg` just landed on): 3149/3154 pass, 0 fail, 5
  skipped, clean.

**Found:** This is a documentation-only fix, exactly as the item's own
description already concluded ("fgOS cannot patch [the harness]... say so
in the skill rather than let the next reader assume it can"). The precise
edit: add a named hazard section to `SKILL.md` (and its `.agents/`
mirror) stating that concurrent worktree-entering dispatch is unsafe at
the harness level today (session-scoped isolation flag, not per-agent —
citing tsk-1y0/tsk-2k0), and that the "dispatch one Agent per id, single
message, running in parallel" loop step (line 200-203) inherits that risk
until the harness fixes it or a per-agent isolation mechanism exists.
Strengthen the verify to grep a phrase the fix itself introduces (e.g.
`"harness-level"` combined with `"isolation"`), so it actually proves the
warning landed rather than passing on the pre-existing incidental word.

**Still open:** Nothing — this closes the item's only open question. No
external lookup needed; both branches (repo search) were sufficient.

## Verdict

`clear` — `verify: "npm test && grep -qi 'harness-level' .claude/skills/fgos-fanout/SKILL.md && grep -qi 'harness-level' .agents/skills/fgos-fanout/SKILL.md"`
