# CONTEXT — shell rc dead source lines

Item: `tsk-5lk` (kind `bug`, tier `standard`, risk `standard`)

Stage `clarify` output. Locked decisions only — no implementation, no shaping.
Shaping and splitting belong to `fgos-coding-planning`.

## Feature boundary

**In scope:** how `fgos setup` and `fgos doctor` decide which shell-profile
`source` line represents fgOS shell integration for a user, and how the test
suite is prevented from writing to the developer's real shell profile.

**Out of scope:** the content or behavior of
`scripts/fgos-shell-integration.sh` itself; PowerShell profile auto-sourcing
(never in scope per tsk-63j D3, `src/setup/shell-rc.mjs:10-14`); the
`.fgos-runner.json` and `core.hooksPath` side effects of `fgos setup`.

## Observed failure

Measured on the reporting machine at the time of clarification:

- `~/.zshrc` carries 41 `source ".../fgos-shell-integration.sh"` lines.
- **2 point at files that exist; 39 point at deleted directories.**
- The file is 267 lines total, so roughly 15% of it is dead fgOS lines.
- Every interactive shell open emits one
  `no such file or directory` error per dead line, e.g.
  `/home/vantt/.zshrc:source:149: no such file or directory: /home/vantt/projects/forgentX/.claude/worktrees/tsk-5z2-xS7g7g/scripts/fgos-shell-integration.sh`

Dead-path prefixes observed, with the code that creates each:

| Prefix | Created by |
|---|---|
| `.claude/worktrees/tsk-*` | `pick`'d per-item worktrees |
| `/tmp/fgos-return-*` | `bin/fgos.mjs:1655` (`return`'s throwaway verify checkout) |
| `/tmp/fgos-worktrees/tsk-*` | `src/runner/worktree.mjs:250` (`createWorktree` default base) |
| `/tmp/tmp.XXXXXXXX` | bare `mktemp -d` copy — no git checkout at all |

## Scout evidence — the causal chain

1. `src/setup/checks.mjs:33` — `integrationScriptPath()` resolves the script
   from `import.meta.url`, i.e. relative to whichever *checkout copy* is
   executing. A linked worktree therefore produces its own distinct absolute
   path.
2. `src/setup/shell-rc.mjs:41` — `hasSourceLine()` matches that exact
   absolute path. Idempotency is consequently **per-checkout-copy, not
   per-user**.
3. `src/setup/checks.mjs:50` — `checkShellIntegrationSourced()` therefore
   always reports `not sourced in: ... — run fgos setup` when run from a
   worktree, even though the user's shell integration already works through
   the main-checkout line.
4. `bin/fgos.mjs:2485` — acting on that message appends a new line naming
   the worktree copy's path.
5. The worktree is later removed by the normal `pick`/`return` lifecycle.
   The `source` line survives it. Nothing prunes.
6. `test/cli/fgos.test.mjs:491` runs `fgos setup` inside a temp linked
   worktree, and the shared `run()` helper at `test/cli/fgos.test.mjs:41`
   inherits `process.env` — including the real `HOME`. Every `npm test` run
   therefore appends a dead line to the developer's actual `~/.zshrc` and
   `~/.bashrc`.

## Locked decisions

| ID | Decision |
|---|---|
| D1 | Fix forward, and `fgos doctor` **reports** the dead source lines it finds. fgOS never edits an rc file to remove a line — deletion stays a human act. |
| D2 | The canonical sourced path is the **main checkout**, resolved via `git rev-parse --git-common-dir`, never the executing copy's own location. One line per real project; a linked worktree never earns its own line. |
| D3 | When the executing copy is **not a resolvable git checkout**, `fgos setup` **declines the rc write and reports why**, while still performing its other work (config, hooks). |
| D5 | Dead source lines make `fgos doctor` report a **failed check** (`passed: false`), naming each dead path. |

### D1 — rationale and cost

Chosen over auto-prune. The user's shell profile is their own file; the 39
dead lines sit interleaved with 226 lines fgOS did not author, and a pruning
heuristic that gets one wrong destroys unrecoverable user configuration.
Doctor already reads rc files (`src/setup/checks.mjs:50`), so reporting costs
no new access. **Cost if wrong:** a user who never reads doctor output keeps
39 shell errors on every open indefinitely.

### D2 — rationale and cost

`git rev-parse --git-common-dir` resolves to the main checkout from inside a
linked worktree, which is the same resolution `scripts/fgos-shell-integration.sh`
and the fgOS skills already use to find the real `.fgos/` (a worktree never
carries its own, per ADR0020,
`docs/decisions/0020-chan-fgos-khoi-worktree-worker.md`). Adopting it here
makes shell-integration resolution consistent with state resolution instead
of being the one place that trusts `import.meta.url`. This breaks the loop at
its source: step 3 stops misreporting, so step 4 never fires. **Cost if
wrong:** a user who deliberately wants a worktree-local integration script
cannot get one; they would source it by hand.

Rejected: a stable install outside any checkout (e.g. `~/.local/share/fgos/`)
— adds an install/update step and a copy that can silently drift from the
checkout. Rejected: treating "any existing line whose target exists" as
satisfied — leaves stale-but-alive lines accumulating.

### D3 — rationale and cost

Follows from D2: with no common dir to resolve, the only candidate is the
ephemeral copy's own path, which is exactly the shape being eliminated. The
observed `/tmp/tmp.XXXXXXXX` corpse came from this case. Declining closes the
last pollution path. **Cost if wrong:** a genuine standalone (non-git)
install of fgOS gets no automatic rc line and must source the script by
hand — acceptable, and `README.md:26-31` already documents that manual form.

Rejected: skipping only for paths under the system temp dir — a heuristic
that misses ephemeral paths located elsewhere.

**Existing covered behavior preserved:** `test/cli/fgos.test.mjs:491` asserts
`fgos setup` succeeds inside a `.fgos/`-less linked worktree. Under D2 a
worktree *does* resolve a common dir, so setup still succeeds there; D3's
decline applies only to non-checkout copies. That assertion stays green.

### D5 — rationale and cost

`bin/fgos.mjs:2518` shows `doctor` returns per-check `{passed, message}` and
always exits 0 — there is no aggregate exit code, so a failed check is a
report signal, not a process failure. Humans and agents read `passed: false`
as must-act, which matches the reality that the user's shell errors on every
open. **Cost if wrong:** because D1 forbids fgOS deleting lines, doctor stays
red for anyone who declines to hand-edit their rc file.

### D4 — test isolation (locked, scope deferred to planning)

`npm test` must not modify the developer's shell profile. The suite sandboxes
`HOME` for tests that exercise `fgos setup`. Locked as required behavior;
whether it lands inside `tsk-5lk` or as a child item is `fgos-coding-planning`'s
call, since it means touching the shared `run()` helper at
`test/cli/fgos.test.mjs:41` used by every CLI test.

## Pinned terms

- **dead source line** — a `source` line in a shell rc file whose target
  path does not exist on disk.
- **canonical path** — the single integration-script path a given machine's
  rc file should source for one project: the main checkout's, per D2.
- **main checkout** — the directory containing the real `.git` and the real
  `.fgos/`, resolved by `git rev-parse --git-common-dir`; distinct from any
  linked worktree.
- **ephemeral copy** — any checkout or copy the fgOS lifecycle creates and
  later removes: `pick` worktrees, `return`'s verify checkout, runner
  worktrees, temp copies.

## Scout paths cited

- `src/setup/shell-rc.mjs` — `detectRcFiles`, `hasSourceLine`, `insertSourceLine`
- `src/setup/checks.mjs:33` — `integrationScriptPath()`
- `src/setup/checks.mjs:50` — `checkShellIntegrationSourced()`
- `bin/fgos.mjs:2478-2517` — `setup` verb
- `bin/fgos.mjs:2518-2524` — `doctor` verb
- `bin/fgos.mjs:1655` — `return`'s temp verify worktree
- `src/runner/worktree.mjs:250` — runner worktree base dir
- `test/cli/fgos.test.mjs:41` — shared `run()` helper, inherits `process.env`
- `test/cli/fgos.test.mjs:491` — setup-in-worktree assertion
- `test/setup/shell-rc.test.mjs`, `test/scripts/fgos-shell-integration.test.mjs`
- `README.md:26-31` — documented manual source form
- `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md` — ADR0020

## Deferred to planning

- Whether D4's test sandboxing ships inside this item or as a child item.
- Whether the dead-line report is a new `doctor` check id or an extension of
  the existing `checkShellIntegrationSourced` message.
- Whether `~/.bashrc` needs the same measured audit `~/.zshrc` got, since
  `detectRcFiles` writes to both (`src/setup/shell-rc.mjs:19`).

## Deferred as scope creep

- Pruning or reporting on non-fgOS dead `source` lines in the user's rc
  files. Not asked for.
- PowerShell profile auto-sourcing. Out of scope per tsk-63j D3.
