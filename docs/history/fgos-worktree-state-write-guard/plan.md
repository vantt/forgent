# plan: fgos worktree state-write guard (tsk-56t)

Decisions this plan honors: D1 and D2 in
`docs/history/fgos-worktree-state-write-guard/CONTEXT.md`. Neither is
reopened here.

## Mode

Flags counted: **3** — standard.

- public contracts (2) — every `SKILL.md` template a session reads mid-flow
  is an agent-facing contract this item changes the invocation shape of.
  First verified by a narrow grep (12 files: `plugins/fgOS/skills/
  {ask,answer,return,discover,move,cook}` and `.claude/skills/fgos/
  {fgos-routing,fgos-coding-exploring,fgos-coding-planning,fgos-coding-validating,
  fgos-coding-implement,fgos-submit-assist}`), then widened during Phase 3's own
  implementation to a full sweep against every `requiresExistingStore:
  true` verb name, not just the 7 originally searched for — found 5 more:
  `plugins/fgOS/skills/{submit,pick,goal,unlock}` and `.claude/skills/fgos/
  {fgos-unlock,fgos-coding-compounding}` (`fgos-coding-validating` dropped — it only
  mentions `discover` descriptively, never calls a state verb itself).
  **17 files total**, grep-verified clean (no remaining bare invocation of
  a `requiresExistingStore: true` verb across either skill tree). There is
  no standalone `decision`/`edit` plugin skill under `plugins/fgOS/skills/`
  (confirmed: `ls` lists only `answer, ask, check, conflicts, cook,
  discover, goal, graph, list, move, pick, ready, return, rollup, stale,
  submit, triage, unlock`) — those two verbs are only ever invoked inline
  from `fgos-coding-exploring`/`fgos-coding-planning`'s own flow text, already covered.
- existing covered behavior (1) — `test/cli/fgos.test.mjs` already has
  uncommitted WIP hardening the exact linked-worktree
  `requiresExistingStore` refusal this plan must not regress.
- weak proof around the area (1, folded into the count above rather than
  double-counted) — the original tsk-3fb/tsk-37v incident happened
  precisely because no test or doc exercised "state verb called from a
  worktree session."

No hard-gate flag applies (no auth, no data loss, no external provider, no
validation removed) — this stays standard, not high-risk.

## Approach

**Chosen:** add one additive, opt-in `--dir <path>` global CLI option to
`bin/fgos.mjs` that overrides `process.cwd()` as `dataDir()`'s base when
given; every skill that calls a state-writing verb from inside a
worktree-resident session resolves the main root the same way the
gate-bypass snippet already does (`git rev-parse --path-format=absolute
--git-common-dir | xargs dirname`) and passes it via `--dir`. Default
behavior (no flag) is byte-identical to today — D5's "cwd-strict, never
git-resolved upward" contract stays the default; `--dir` is an explicit
escape hatch a caller must opt into, never a silent change to what a bare
`fgos <verb>` does.

**Rejected alternatives:**
- *Bake a git-common-dir fallback straight into `dataDir()`* (no flag,
  auto-resolve upward when the strict path is missing) — rejected: this
  silently reopens D5 for every caller, not just worktree sessions, and
  removes the one signal (loud refusal) that made tsk-4fu-2's guard safe.
  Reopening a stated CLI contract needs its own explicit decision, not a
  side effect of this item.
- *Read state via `git show fgw/<id>:.fgos/events.jsonl`* (option a) —
  rejected per D1: superseded by the already-merged
  `requiresExistingStore` guard; no code path in this repo does branch-ref
  reads of `.fgos/` today, and adding one duplicates the escape hatch
  above for no extra benefit.
- *Fix only `scripts/fgos-shell-integration.sh`'s `fgos()` function* —
  rejected: it is opt-in (never auto-sourced, per the script's own header)
  and every skill snippet audited below invokes `node .../bin/fgos.mjs`
  directly (the same style `pick`'s own `SKILL.md` uses), never the shell
  function — fixing only the function would leave every real caller
  unfixed.
- *Skip the `--dir` flag entirely; wrap each of the 12 snippets' node call
  in a `(cd "$root" && node bin/fgos.mjs <verb> ...)` subshell instead* —
  a genuinely smaller, zero-code-change alternative (empirically exercised
  this whole session). Rejected anyway: it depends on every caller
  remembering the subshell parens — a bare `cd "$root" && node ...`
  (parens dropped) permanently moves the session's cwd off the worktree.
  This session's own harness happens to reset cwd after every shell call,
  masking that failure mode here, but `fgos-shell-integration.sh` (this
  same mechanism, sourced into a real persistent shell per its own header)
  gets no such reset. `--dir` removes the operator-error class outright
  instead of relying on every snippet author remembering parens.

## Risk map

| component | risk | proof point (→ fgos-coding-validating) |
|---|---|---|
| `bin/fgos.mjs` `--dir` flag parsing / `dataDir()` | low — additive, default path unchanged | `fgos list --dir <mainRoot>` run with cwd inside a `.fgos/`-less linked worktree returns the real view; `fgos list` with no `--dir` from the same cwd is unchanged (still silent-empty, until phase 2) |
| requiresExistingStore refusal path | low — must not regress tsk-4fu-2 | existing + WIP tests in `test/cli/fgos.test.mjs` still pass unmodified; a state verb given a garbage `--dir` still refuses with the same `.fgos/ not found` message, just naming the given dir instead of cwd |
| read-verb (`list`/`ready`/...) missing-store signal | low — additive field/stderr, no shape break | new test: the field is present and true only when `!fs.existsSync(dir) && !isMainWorktree(cwd)`; absent for a normal fresh non-worktree dir with no store (that case stays "not evaluated", not "warning") |
| `SKILL.md` snippet rewrites (17 files, grep-verified) | low-medium — most-touched surface, easy to miss one | manual dry run: pick a real throwaway item, walk pick → exploring (`ask`/`decision`) → planning (`decision`) → validating → return entirely from the worktree, confirm main's `.fgos/events.jsonl` gets every event and `approve` sees `proposed` with no manual `cd`/subshell |

## Shape (phased)

1. **CLI escape hatch.** `bin/fgos.mjs`: add `--dir <path>` (global flag,
   every verb) — when present, `dataDir()` uses `path.resolve(flags.dir)`
   instead of `process.cwd()`; absent, behavior is exactly today's. Add
   cases to `test/cli/fgos.test.mjs` (alongside the existing `tsk-4fu-2`
   linked-worktree fixtures already there): a state verb succeeds against
   a real store via `--dir` from a `.fgos/`-less worktree cwd; the same
   verb with no `--dir` still refuses exactly as before (regression guard
   for tsk-4fu-2).
2. **Read-verb signal (D2).** For the `requiresExistingStore: false` verbs
   (`list`/`ready`/`graph`/`stale`/`check`/`rollup`/`conflicts`/`triage`),
   when the resolved dir has no `.fgos/` and `cwd` is a linked worktree
   (`isMainWorktree` from `src/runner/merge.mjs` already does this check
   for `init`), surface it as a **stderr warning line**, never a JSON
   `data` field — `ready`/`triage` can return a bare array when called
   unpaginated (`paginateVerbResult`), and `JSON.stringify` silently drops
   a named property set on an array, so a `storeMissing` field would only
   ever reach the other 6 verbs, not all 8 (found during Phase 2's own
   implementation — the plan's original approach). A stderr line keeps
   stdout's `data` shape byte-identical in every case, the same
   stdout=data/stderr=diagnostics split `main()`'s own error path already
   uses. Test: the line appears for a linked-worktree cwd across at least
   one array-shaped verb (`ready`) and one object-shaped verb (`list`), is
   absent for a normal non-worktree cwd with no store (that stays "not
   evaluated", not "warning").
3. **Skill contract rewrite — two idioms, matched to what each file
   already does** (refined during this phase's own implementation, found
   by empirically checking whether `${CLAUDE_PROJECT_DIR}` survives an
   `EnterWorktree` switch — it does: this very session's own `/fgOS:pick`
   render resolved it to the main checkout even though the session's cwd
   was already a worktree at that point):
   - `plugins/fgOS/skills/{ask,answer,return,discover,move,submit,pick,
     goal,unlock,cook}/SKILL.md` (10 files — 6 identified going in, 4 more
     found during this phase's own full-verb-name sweep: `submit`, `pick`,
     `goal`, `unlock`) already compute
     `${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}` as
     the prefix for `/bin/fgos.mjs` — that same value, by construction, IS
     the repo root. Reuse it verbatim as `--dir`'s value; no new
     subprocess, no new mechanism.
   - `.claude/skills/fgos/{fgos-routing,fgos-coding-exploring,fgos-coding-planning,
     fgos-coding-implement,fgos-submit-assist,fgos-unlock,fgos-coding-compounding}/
     SKILL.md` (7 files — `fgos-coding-validating` dropped, it never calls a
     state verb itself; `fgos-unlock`/`fgos-coding-compounding` found during the
     same sweep) never use `${CLAUDE_PROJECT_DIR}` today (some are loaded
     mid-session via the Skill tool, not a slash command, so that
     substitution isn't verified available there) — they keep the
     git-common-dir one-liner they already use successfully in their own
     embedded gate-check snippet (or gain one instruction bullet where
     they had none, rather than rewriting every individual inline
     mention), resolving `root` once and passing `--dir "$root"` on every
     state-verb call. Same untrusted-input rule already in force (item
   `title`/`description` stays a discrete quoted argv element — `--dir`
   doesn't change that).
4. **End-to-end proof.** The dry run described in the risk map's last row,
   carried to `fgos-coding-validating` as this plan's concrete proof case,
   alongside the boundary cases: garbage `--dir` value (clean validation
   error, not a crash), and running from the actual main checkout with
   `--dir` pointed at itself (no-op, identical result to omitting it).

No split: one cohesive item, four phases, no independently-workable piece
that benefits from becoming its own child work item.

## Ordering signal

`fgos graph --json`: `tsk-56t` sits on the critical path right after
`tsk-4fu` (already merged) and is the top `topUnblock` entry
(`unblocks: 2, newlyUnblocks: 3`) — worth finishing before its dependents,
not deferring.
