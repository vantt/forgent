# Guide: activate the S5 release on an owner machine (Execution read door)

For: the owner or the big lead, on each machine that runs fgOS (this repo's main checkout and every other project that has
the release active). Written 2026-11-18 at the close of the Execution read door (plan
`plans/261115-2328-execution-read-door`, phase 12). Run the steps in order, on the machine itself. Never print credential
values or login-store contents.

## Why the order matters

- The Seat Binding route changed from protocol 1 to protocol 2 (`fgos internal seat-binding`, host wiring), and the replay
  digest of a run now covers the runner section the caller sends. A Node payload and a host of different releases cannot
  talk, and a run bound under the old digest cannot be replayed under the new one. A run or assignment still open across
  the switch fails or cannot resume. (plan D16)
- The config repair that moves per-capability taste (`move-capability-taste`) and the repair that removes empty
  `runner.providers.<p>.accounts` shells run only in `fgos doctor --fix`; until they run, a config that still holds the
  old keys is refused by name, and the `dispatch-decide` hook then blocks every Agent/Task call of that project.

## 1. Before activation (nothing may be in flight)

1. No `fgos run` and no workflow run in flight on the machine, in any worktree: look at the herdr panes and
   `fgos dispatch inspect` in each project. Let a running one finish, or stop it deliberately.
2. No open mutating assignment: `fgos dispatch inspect` lists them (`--attention` shows the ones that need a person).
   Settle or cancel each one (`fgos dispatch inspect` shows the next command for it); do not leave one "to resume after the
   upgrade": its protocol and replay digest change, so it will not resume.
3. Reconcile the main checkout's uncommitted `.fgos/config.yaml` edits before pulling: `git -C <main checkout> status
   --short .fgos/config.yaml`. Commit it on the trunk, or put the change aside through a temporary commit on a branch,
   never a bare `git stash` (the stash is shared with every worktree). A pull over an unreconciled file either refuses or
   mixes the new standard with an old taste layout.
4. Machine accounts are on `runner.llmAccounts` only: `rg -n "accounts:" .fgos/config.yaml ~/.fgos/private/accounts.yaml`
   (key names only, never values). The design-lap guide
   (`reports/guide-261117-2230-design-lap-llm-accounts-move.md`) says how; the board line "all machines on llmAccounts"
   (2026-11-17) records that it was done.

## 2. Build, stage and activate in one window

Build the release from the tree that carries this plan's integration head on main, stage it, and activate it in each
project without other work in between (recipe: `docs/how-to/measure-a-real-case.md`, `fgctl stage` then `fgctl upgrade`;
background in `docs/how-to/install-fgos-in-a-project-and-use-doctor.md`).

```bash
fgctl stage --from <release-dir-or-archive>
fgctl upgrade --from <release-dir-or-archive>     # in each project root
fgctl status                                      # active release is the new one
```

Do not edit `src/` or `bin/` while the window is open: plain `fgos` runs the activated release, not the working tree
(use `npm run fgos:dev -- <verb>` for working-tree code).

## 3. Right after activation, in every project

```bash
.fgos/installation/bin/fgos doctor --fix
.fgos/installation/bin/fgos doctor
```

- `doctor --fix` moves per-capability role and persona taste into `runner.roles` and `runner.personas`, drops capability
  seats, and removes empty `runner.providers.<p>.accounts: {}` leftovers. It prints what it moved.
- **A conflicting value stops for the person.** When two capabilities carried different taste for the same persona or role,
  the repair leaves both and names them: settle each with `fgos config set` or `fgos config unset`, then run
  `fgos doctor --fix` again. Taste found in the global file is removed (it cannot hold it).
- Run the plain `doctor` through the installed shim last (`.fgos/installation/bin/fgos`), not through `npm run fgos:dev`:
  `active-release-matches-checkout` compares the activated release with the checkout.
- Expected doctor shape: the seven executor-model rows (`runner-generated-paths`, `executor-confinement`,
  `invocation-git-write-grants`, `capability-serves-valid`, `omp-natives-present`, `agy-sub-homes-configured`,
  `tool-registry-configured`) are judged by the host; `seat-binding-route` and `agent-type-names-unique` still come from
  the Node bridge (`bridge:S6a`) and pass only when the activated payload and host are one release.

## 4. If something looks wrong

- Every Agent/Task call is blocked with a `config-*` message: the project config still holds a retired key. Run
  `fgos doctor --fix`; if the message names a conflicting value, settle it as in section 3.
- `seat-binding-route` fails with a protocol message: the host and the Node payload are different releases. `fgctl status`,
  then `fgctl repair` (rolls back to the previous release) or `fgctl upgrade --from` the intended one.
- A project whose `maxTier` is `flagship` now has its architecture frontier seats capped at flagship (the rows' own
  `maxTier: frontier` left the standard). This repository raised its own to `frontier`; another project that wants the old
  ceiling sets `maxTier: frontier` in its own config.
- Rollback: `fgctl repair` re-activates the previous release. Do it before any new run starts. If `fgos doctor --fix` already
  rewrote the config (taste moved into `runner.roles` and `runner.personas`), the older release does not read the new keys:
  prefer settling the conflict on the new release over rolling back.

## Linked from

The program board row of the Execution read door (`plans/261017-1313-fgos-platform-program-board/plan.md`) and the close
report `erd-p12-close.md`; the board line is added by the lead.
