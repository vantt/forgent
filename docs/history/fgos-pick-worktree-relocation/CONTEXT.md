# CONTEXT: fgOS pick worktree relocation (tsk-424)

## Feature boundary

Fix `fgos pick`'s (Case A: interactive session, `/fgOS:pick` + `EnterWorktree`)
worktree base directory so a session that has already switched into one
item's worktree can switch again into a second item's worktree within the
same session — the concrete trigger being a root item that decomposes into
children mid-session, each child needing its own `fgw/<child-id>` worktree.

Dogfood-confirmed root cause (decision 0018, item `tsk-1wd` -> `tsk-1wd-1`,
2026-07-28): first `EnterWorktree` call (into the root's worktree) succeeds
regardless of location; every `EnterWorktree` call after the first requires
the target path to sit under `<repoRoot>/.claude/worktrees/` of the same
repo. `fgos pick` creates its worktrees under `os.tmpdir()/fgos-worktrees`,
so the second switch is refused by the harness with
`".claude/worktrees" does not exist, so <path> cannot be a worktree managed
by Claude Code`.

Out of scope: Case B (headless `fgos-runner --once` dispatch) never calls
`EnterWorktree` at all — it spawns one worker process per item with `cwd`
pointed straight at the worktree path, so it never hits this constraint
regardless of its own worktree base. Also out of scope: the short-lived
ephemeral worktrees `merge`/`return`-adjacent code creates for
merge/conflict checks (`bin/fgos.mjs:1689`, `bin/fgos.mjs:1948`) — removed
in the same call via a `finally` block, never targeted by `EnterWorktree`.

## Pinned terms

- **Case A** — an interactive session driving work through `/fgOS:pick` +
  the harness's own `EnterWorktree` tool (per `docs/backlog.md` row
  `p-58f890f3`, the `tsk-1wd` dogfood).
- **Case B** — headless `fgos-runner --once` dispatch; no session, no
  `EnterWorktree`, unaffected by this scenario.
- **root/child decompose-mid-session** — a session already `EnterWorktree`'d
  into a root item's worktree picks a child of that same root and needs a
  second, in-session switch into the child's own worktree.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | The fix is an infra change: relocate `fgos pick`'s worktree base directory to `<repoRoot>/.claude/worktrees/` — not a doc-only answer (neither "always open a new session per child" nor "formalize the direct Bash/absolute-path workaround" as the officially blessed path). |
| D2 | Scope is limited to the `claimWork` call inside `bin/fgos.mjs`'s `case 'pick'` — only that call site passes the new `worktreeDir`. `fgos-runner` headless dispatch (`src/runner/loop.mjs`) and the ephemeral merge/approve worktrees (`bin/fgos.mjs:1689`, `bin/fgos.mjs:1948`) keep their current `os.tmpdir()/fgos-worktrees` behavior untouched. `createWorktree()`'s own shared default in `src/runner/worktree.mjs` does not change. |

## Scout evidence

- `plugins/fgOS/skills/pick/SKILL.md` step 3 (git blame: commit `4b148f4`,
  2026-07-23, predates tsk-424's filing) already documents a generic
  EnterWorktree-failure fallback: print the worktree path, tell the user to
  open a new session there. Established pattern, not invented here.
- The `EnterWorktree` tool's own current description: the first switch in a
  session may target any git-registered worktree path; every switch after
  the first must target a worktree under `.claude/worktrees/` of the same
  repository — the literal mechanical constraint tripped by the
  `tsk-1wd` -> `tsk-1wd-1` dogfood.
- `.gitignore` lines 33-38 already exclude `/.claude/*` except
  `skills/`/`settings.json` — `.claude/worktrees/` needs no new gitignore
  entry.
- `src/runner/worktree.mjs:210-216` — `createWorktree(repoRoot, id, opts)`:
  `baseDir = opts.worktreeDir ?? path.join(os.tmpdir(), 'fgos-worktrees')`,
  one shared function, base overridable per caller.
- `src/runner/claim-port.mjs:65,170` — `claimWork(...)` threads
  `opts.worktreeDir` straight into `createWorktree`.
- `bin/fgos.mjs` `case 'pick'` (~line 1234-1268) calls `claimWork(dir, {id,
  actor: 'session', isolate: true, claimTrigger, repoRoot: process.cwd()})`
  — no `worktreeDir` passed today, hence the tmp default.
- `bin/fgos-runner.mjs` and `src/runner/loop.mjs` (Case B): grepped, neither
  sets an explicit `worktreeDir` override today either, but Case B never
  calls `EnterWorktree` — structurally unaffected regardless of its own base
  path.
- `docs/backlog.md` row `p-58f890f3` — the discovery row this item was
  promoted from.
- `docs/distillery/porting-log.md` rows `worktree-native-tool-detect-and-defer`
  and `tool-description-override-consent-bridge` — related prior art,
  explicitly not this item's scope (tracked separately, not yet promoted).

## Deferred to planning

- Exact implementation shape of the `worktreeDir` value passed at the pick
  call site (inline `path.join(repoRoot, '.claude', 'worktrees')` vs a
  shared helper/constant).
- Existing in-flight worktrees already created under the old
  `os.tmpdir()/fgos-worktrees` path (including this very session's own
  `tsk-424` worktree) need no migration — they keep working at their
  original location; only newly created pick worktrees benefit from the
  relocation. Revisit only if planning finds a concrete conflict.
- Whether any test fixture/assertion hardcodes the pick path's old worktree
  base — planning/implementation to verify via a `test/` grep and update as
  needed.
- Whether `plugins/fgOS/skills/pick/SKILL.md` step 3's fallback prose should
  be trimmed/updated now that this scenario is fixed at the infra level
  rather than documented as a standing limitation.
