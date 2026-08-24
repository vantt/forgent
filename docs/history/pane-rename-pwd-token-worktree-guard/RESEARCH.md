# Research log — pane-rename-pwd-token-worktree-guard (tsk-1ml)

## Round 1 — 2026-08-23 (fgos-researching, stage discovery)

**Asked:** where does the worktree-isolation guard that refuses `bash
plugins/fgOS/skills/terminal/rename.sh "<id>" "$PWD"` (documented at
`.agents/skills/fgos-coding-driving/references/loop-mechanics.md:87` and
its 3 mirror copies) actually live, and what is the real, working fix —
does the guard's own complexity heuristic need to change, or does the
call site need to stop passing an unresolved `$PWD` token?

**Checked:**

- `rg "too complex to verify" --hidden -g '!.git' .` across the whole
  repo: zero implementation hits — every match is prose in a `SKILL.md`
  quoting the guard's own error text, a `docs/history/` research note, or
  an `.fgos/events.jsonl` record. **The guard is not implemented anywhere
  in this repo** — it is a Claude Code harness-level built-in, outside
  this repo's own source and not something a change here can alter.
  Same conclusion already reached independently by two prior items:
  `docs/history/worktree-guard-compound-command-prose-fix/RESEARCH.md`
  Round 1, and `docs/history/tsk-3rg-pick-approve-worktree-friction/
  RESEARCH.md` Round 1 — this item's own "special-case the guard" fix
  direction is therefore **not achievable**, matching the same premise
  correction both precedents already made for their own items.

- **Direct precedent, same root cause, already-proven fix:**
  `tsk-3rg`'s RESEARCH.md (Round 1) reproduced the identical guard live
  for a different unresolved-variable shape (`root=$(git rev-parse ...)`
  chained with `node .../fgos.mjs --dir "$root"` in one call) and found:
  "the SAME two commands run as two SEPARATE tool calls, with the second
  substituting the literal resolved path instead of `$root`: works."

- **Reproduced this item's own repro live, in this exact session, inside
  tsk-1ml's own claimed worktree** (`/home/vantt/projects/forgentX/.claude/worktrees/tsk-1ml-ro4qDp`):
  - `bash plugins/fgOS/skills/terminal/rename.sh "tsk-1ml" "$PWD"` →
    refused: "This session is isolated in the worktree ..., but this
    command is too complex to verify that it stays inside the worktree."
    Exact match to the item's own description and to the independent
    second repro already logged against this item (`tsk-4te`, decision
    at `.fgos/events.jsonl` seq 23442, same day).
  - `bash plugins/fgOS/skills/terminal/rename.sh "tsk-1ml" "/home/vantt/projects/forgentX/.claude/worktrees/tsk-1ml-ro4qDp"`
    (the exact same script, same args, with the literal already-resolved
    absolute path substituted for the `"$PWD"` token) → **exit 0,
    succeeds.** Confirms tsk-3rg's fix pattern transfers exactly to this
    call site: the guard's complexity check is defeated by an unresolved
    shell variable, not by the script itself or by the worktree-isolated
    session context in general.

- **Scope — every occurrence of the broken shape:**
  `rg -n 'rename\.sh.*PWD' --hidden -g '!.git' -g '!node_modules' .` finds
  exactly 4 hits, all the same line 87, one per mirror copy of the same
  file: `domains/coding/skills/fgos-coding-driving/references/
  loop-mechanics.md`, `plugins/fgOS/skills/fgos-coding-driving/
  references/loop-mechanics.md`, `.agents/skills/fgos-coding-driving/
  references/loop-mechanics.md`, `.claude/skills/fgos-coding-driving/
  references/loop-mechanics.md`. Same 4-way mirror set tsk-3rg's own fix
  touched, verified by the same test.

- **Not already covered by a prior fix.** `docs/history/
  driving-discovering-worktree-guard-note/` (tsk-jyn) applied this exact
  same "split into two calls + substitute the literal path" pattern to
  `loop-mechanics.md`'s Step 1 (`fgos list --id <id> --json` /
  `root=$(git rev-parse ...)` occurrence) — a different line, a different
  occurrence, same file. It never touched Step 5's `rename.sh "<id>"
  "$PWD"` line. This item's own occurrence is a genuinely separate gap,
  not a re-discovery of an already-fixed one.

- **Non-gating context confirmed:** the pane-rename call's own hard rule
  ("never stop, retry, or branch on its result — decoration, never a
  gate", `fgos-coding-driving/SKILL.md` Hard rules) means the guard
  refusal never breaks a drive today — but it does silently defeat pane
  relabeling on every stage transition inside a worktree-isolated
  session, which is the item's real complaint.

**Verdict:** `clear`. The corrected, actionable fix: rewrite
`loop-mechanics.md` Step 5's pane-rename command (in all 4 mirror
copies) to substitute an already-resolved literal absolute path for the
`$PWD` token, instead of embedding the literal shell-variable text — same
category of fix, same evidence shape, as tsk-3rg/tsk-jyn's own already-
shipped fixes for the sibling `root=$(...)` occurrence in the same file.
Real verify (same test tsk-3rg/tsk-jyn both used, applies here since the
same 4-way mirror set is touched):
`node --test test/skills/fgos-mirror.test.mjs`.
