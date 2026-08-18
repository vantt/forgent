# RESEARCH.md — tsk-1ep (fgos-coding-implement decide-first prose fix)

## Round 1 — 2026-08-17

**Asked:**
1. Which file(s) are the real canonical source vs. generated wrapper for
   `fgos-coding-implement`, and which need editing?
2. Is `plugins/fgOS/skills/fgos-coding-implement/SKILL.md` a byte-identical
   mirror of `.agents/skills/fgos-coding-implement/SKILL.md` that also
   needs the edit, or does something regenerate it?
3. Does `docs/task-specs/coding/implement-item.md` restate the same stale
   "never delegate unless narrow reason" framing?

**Checked:**
- `.claude/skills/fgos-coding-implement/SKILL.md` — 15 lines, frontmatter +
  a pointer notice ("This is a generated thin wrapper (tsk-1qi D5/D7) --
  do not edit directly, edit the source instead. The real skill content
  lives at `../../../.agents/skills/fgos-coding-implement/SKILL.md`").
  Confirmed intentionally different by design (D5/D7) — not a target for
  this edit.
- `diff plugins/fgOS/skills/fgos-coding-implement/SKILL.md
  .agents/skills/fgos-coding-implement/SKILL.md` — **files are identical**
  (364 lines each). No sync script found in `package.json` or elsewhere
  (`grep -n "sync\|regen\|mirror" package.json` — no hits). Matches the
  documented convention elsewhere in this repo ("mirrored byte-identical
  at .agents/skills/", `AGENTS.md`'s own Dispatch section, describing the
  same pattern for the `_shared/executor-dispatch-fallback.md` fragment).
  Conclusion: both `.agents/skills/fgos-coding-implement/SKILL.md` (the
  stated canonical source) and `plugins/fgOS/skills/fgos-coding-implement/
  SKILL.md` (its byte-identical mirror) must be edited identically — this
  is a manual-parity convention, not a build step, so an edit to only one
  would silently drift.
- `grep -n "never delegate\|escape hatch\|narrow helper task\|Native-First\|
  do your own Implement" docs/task-specs/coding/implement-item.md` — no
  hits. That task-spec doc does not restate the stale framing; no edit
  needed there.
- `docs/decisions/0033-cli-spawn-shaped-capacity-thang-hasLiveTaskAccess.md`
  — confirmed (prior session's own research, this same conversation):
  extends 0026, dated 2026-08-16, establishes that `decide()` always
  resolves `out-of-process` for a registered cli-spawn-shaped capacity
  (e.g. `agy`) regardless of `--has-live-task-access`. Config wins over
  "do it yourself because I have a live Task tool".
- `node src/runner/dispatch.mjs decide --work <id> --has-live-task-access`
  — live-verified this same session (tsk-52z's own drive): returned
  `{"mechanism":"out-of-process","configured":true,"executorId":
  "fgos-coding-implement"}` for a `coding`-domain item at `executing`,
  confirming 0033's behavior is real and already active, not merely
  documented.

**Found:**
- Two files to edit, identically: `.agents/skills/fgos-coding-implement/
  SKILL.md` and `plugins/fgOS/skills/fgos-coding-implement/SKILL.md`.
  `.claude/skills/fgos-coding-implement/SKILL.md` (the thin wrapper) is
  untouched by design.
- No other doc in the repo restates the stale framing that also needs
  fixing.
- Real verify: `diff` between the two edited files should stay empty
  (parity), plus a grep-negative for the old phrase and a grep-positive
  for the new "always call decide first" instruction, plus `npm test`.

**Open:** none — both points resolved with direct evidence.
