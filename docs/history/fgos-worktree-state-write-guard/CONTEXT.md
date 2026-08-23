# fgos worktree state-write guard (tsk-56t)

## Feature boundary

`pick`'s own `SKILL.md` switches a session into the claimed item's linked
worktree (`EnterWorktree`) so code/test work happens there. Every worktree
created by `createWorktree` (`src/runner/worktree.mjs`, ADR0020) deliberately
carries no `.fgos/` at all — a bare `git worktree add` would fork a stale,
committed snapshot, so `createWorktree` removes it outright rather than let
it silently diverge from the real store. `bin/fgos.mjs`'s CLI resolves
`.fgos/` strictly under `process.cwd()` (`dataDir()`, D5) and never
git-resolves upward.

tsk-56t started from the observation (tsk-3fb/tsk-37v, 2026-07-28) that a
session standing in a picked worktree calling `discover`/`edit`/`decision`/
`return` appeared to write into a worktree-local, empty `.fgos/` that main
never sees — leaving `approve` stuck reporting `"doing", not "proposed"`
even after real work landed on `fgw/<id>`.

## What changed the picture

A separate, already-merged task (**tsk-4fu-2**, commit `259405a`
`feat(fgos): refuse state verbs before .fgos/ store exists`) added
`requiresExistingStore` to every verb in `src/cli/command-registry.mjs` and
wired the runtime check (`bin/fgos.mjs:2471`):

```
if (entry?.requiresExistingStore && !fs.existsSync(dir)) {
  throw new StoreError('validation',
    `.fgos/ not found at "${dir}" -- run "fgos init" here first, or check you
    are not inside a linked worktree (worktrees never carry .fgos/, per
    ADR0020: docs/decisions/0020-chan-fgos-khoi-worktree-worker.md).`);
}
```

`ask`/`answer`/`decision`/`discover`/`return`/`edit`/`move`/`take`/`pick`/
`approve`/`reject`/`goal`/`unlock`/`rebuild`/`repair`/`catchup`/`add`/
`submit`/`compound` are all `requiresExistingStore: true` — every one of
these now refuses loudly (exit 4) instead of silently creating a worktree-
local store. Uncommitted WIP already in the main checkout
(`test/cli/fgos.test.mjs`, still tagged `tsk-4fu-2`) further hardens exactly
this linked-worktree scenario (`tmpLinkedWorktreeCwd`, "init inside a linked
worktree is refused").

Empirically reproduced live in this session: `node bin/fgos.mjs list` run
from inside `.claude/worktrees/tsk-56t-YF4AYi` returns an empty view with no
error (`list` is `requiresExistingStore: false`); the write verbs above
would instead throw the refusal above. No `fgos sync` verb exists anywhere
in the CLI — the `chore(fgos): sync events` commit at HEAD is a manual `git
add`/`git commit` of `.fgos/events.jsonl`, not a CLI mechanism.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | tsk-56t's scope narrows to option (b) only: main checkout is the sole `.fgos/` store; option (a) (reading state via `git show fgw/<id>:.fgos/events.jsonl` instead of literal cwd) is dropped as unnecessary. The silent-divergence/corruption risk is already closed by tsk-4fu-2's `requiresExistingStore` guard (259405a, merged). What remains is defining + documenting how a worktree-resident session (after `pick`'s own `EnterWorktree` step) actually runs a state-writing verb against main once refused — a UX/doc gap, not a data-safety gap. |
| D2 | In scope: read-only verbs (`list`/`ready`/`graph`/`stale`/`check`/`rollup`/`conflicts`/`triage`, all `requiresExistingStore: false`) silently return an empty view inside a worktree with no signal the real store lives elsewhere. tsk-56t also covers surfacing that (so a worktree-resident session doesn't misread "empty view" as "no open work"). |

## Pinned terms

- **Silent divergence** — a state-writing verb creating/writing its own
  `.fgos/` inside a worktree cwd, invisible to the main checkout until a
  human manually merges the branch. This is the failure mode D1 says is
  already closed.
- **Main checkout** — the repo root whose `.fgos/` is the one real store;
  every linked worktree under `.claude/worktrees/` is deliberately
  `.fgos/`-less (ADR0020).

## Deferred to planning

- The concrete mechanism for a worktree-resident session to invoke a state
  verb against main (e.g. an explicit `--dir`/env override, a CLI-side
  git-common-dir fallback inside `dataDir()`, or a purely doc-level fix
  in `pick`/`fgos-routing`/`return`'s own `SKILL.md`s instructing the caller
  to resolve/cd to the main root first) is an implementation choice, not a
  product decision — `fgos-coding-planning`'s job.
- Whether/how to surface D2's read-verb silence (a warning line, a changed
  default, a doc note) is also an implementation choice for planning.

## Canonical references

- `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md` (ADR0020 — worktree
  isolation, tsk-1an)
- `src/runner/worktree.mjs` (`createWorktree`, the ADR0020 removal step)
- `src/runner/paths.mjs` (`resolveFgosDir`/`resolveRepoRoot`, the
  `strict` cwd-vs-git-resolved switch, D5)
- `bin/fgos.mjs:2461-2481` (the `requiresExistingStore` runtime guard,
  tsk-4fu-2)
- `src/cli/command-registry.mjs:34-46` (the guard's own field-doc comment)
- `test/cli/fgos.test.mjs` (`tmpLinkedWorktreeCwd`, uncommitted WIP hardening
  the exact linked-worktree scenario)
- `.claude/skills/fgos/fgos-routing/SKILL.md`, `plugins/fgOS/skills/pick/SKILL.md`
  (the `EnterWorktree` step this gap traces back to)
