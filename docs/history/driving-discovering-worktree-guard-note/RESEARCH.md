# Research log — driving-discovering-worktree-guard-note (tsk-jyn)

## Round 1 — 2026-08-20

**Asked:** Find the exact wording of the safety note tsk-3rg added to the
4 sibling coding-domain skill files at each file's first `root=$(...)`
occurrence — the note about running the `root=$(...)` resolve and the
following `fgos.mjs` call as two SEPARATE tool calls, plus a
literal-path-substitution instruction — so it can be replicated verbatim
into the 2 files tsk-jyn names as still missing it:
`fgos-coding-driving/references/loop-mechanics.md` (Step 1) and
`fgos-coding-discovering/SKILL.md`.

**Checked:** repo search (`rg`) across all 4 sibling files named in
tsk-jyn's own description, plus `fgos-coding-validating`'s two reference
files (`bootstrap-and-reality-gate.md`, `gate-auto-approve-mechanics.md`)
since validating's own `SKILL.md` carries no `root=$(...)` occurrence
directly — the pattern lives only in its reference files.

**Found — 4 verbatim instances of the note, each adapted to its own call
site's surrounding prose but sharing one fixed shape (two split ```bash
blocks + a prose note using the words "two SEPARATE tool calls", "never
pasted together", "worktree-isolated session's own isolation guard
refuses", "even though each ... is safe alone/on its own", and
"substitute ... literal ... path into the second[, separate] call"):**

- `.agents/skills/fgos-coding-exploring/SKILL.md:38-43`:
  > Run the resolve and the `fgos.mjs` call as two SEPARATE tool calls,
  > never pasted together as one script — a worktree-isolated session's
  > own isolation guard refuses a single call combining a `git`-rooted
  > command with a following `node .../fgos.mjs` invocation, even though
  > each is safe alone. Substitute `root`'s literal printed value into
  > the second call.

- `.agents/skills/fgos-coding-planning/SKILL.md:34-37`:
  > Run the resolve and the `fgos.mjs` call as two SEPARATE tool calls,
  > never pasted together — a worktree-isolated session's own isolation
  > guard refuses a single call combining them, even though each is safe
  > alone.

- `.agents/skills/fgos-coding-implement/SKILL.md:65-70`:
  > Run these as two SEPARATE tool calls, never pasted together as one
  > script — a worktree-isolated session's own isolation guard refuses a
  > single call that combines a `git`-rooted command with a following
  > `node .../fgos.mjs ... --dir` invocation, even though each command is
  > safe on its own. Resolve `root` alone first, read its printed value,
  > then substitute that literal path into the following `fgos.mjs` call.

- `.agents/skills/fgos-coding-validating/references/gate-auto-approve-mechanics.md:5-11`
  (validating's own reference file — the sibling `bootstrap-and-reality-gate.md:17-23`
  shows the same two-block split with no restated prose, since the note
  already appears once earlier in that same file):
  > Run the `root=$(...)` line and the `gate-check` call below as two
  > SEPARATE tool calls, never pasted together as one script — a
  > worktree-isolated session's own isolation guard refuses a single call
  > combining a `git`-rooted command with a following `node` invocation,
  > even though each command is safe alone. Resolve `root` alone first,
  > read its printed value, then substitute that literal path into the
  > second, separate call.

**Common shape across all 4:** the `root=$(...)` line sits in its own
fenced ```bash block, immediately followed (no shared block) by a second
```bash block for the `fgos.mjs ... --dir "$root"` call, with the prose
note placed in the surrounding text right before (planning, validating)
or right after (exploring, implement) the two blocks.

**Confirmed gap (tsk-jyn's own claim, re-verified this round):**
- `fgos-coding-driving/references/loop-mechanics.md` Step 1 (lines 17-20)
  still ships `root=$(...)` and the `fgos.mjs list` call in ONE shared
  ```bash block, no note.
- `fgos-coding-discovering/SKILL.md` (lines 116-121, Orient step) same
  shape — one shared block, no note. (Its Step 3 research-consult block,
  lines 146-152, and Step 5 engine-verb block, lines 183-191, already use
  the correct split-block shape without the prose note — only the first
  Orient-step occurrence per file needs the note added, matching the
  "at each file's first occurrence" pattern the 4 siblings already use.)

**Still open:** none — wording, placement convention, and both target
files' current (unguarded) shape are all confirmed directly from source.
