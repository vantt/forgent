# RESEARCH — tsk-3bh (dispatch.mjs execute path never guards a dirty target cwd)

## Round 1 — 2026-08-24 (discovery stage)

**Asked:** Confirm whether the external out-of-process executor `agy`
("Antigravity Cli"), or any other configured executor, performs its own
git reset/clean/checkout/stash as part of startup — the presumed
explanation for the observed wipe during tsk-3df, where a driver
session's uncommitted edit to
`docs/history/tsk-3df-sync-root-guard-regression-gap/plan.md` vanished
after `node src/runner/dispatch.mjs execute agy` returned `[DONE]`. Also:
is there an existing, reusable in-repo discipline for guarding a target
directory against a destructive reset over uncommitted work that this
item's fix could mirror?

**Checked:**

- `agy --help` (installed at `/home/vantt/.local/bin/agy`, "Antigravity
  Cli") — no `--sandbox`/reset-related flag documented that would explain
  a filesystem wipe under the flags this repo actually passes it
  (`-p {prompt} --mode accept-edits --new-project --print-timeout 30m
  --model {model}`, from `.fgos/config.json`'s `runner.executors.agy`).
- `agy changelog` (full release notes) — searched for
  `new-project`/`workspace`/`revert`/`checkpoint`/`snapshot`/`git
  reset`/`git clean`/`git stash`/`discard`/`uncommitted`/`working tree`.
  Found: "Added support for `--project` and `--new-project` launch flags
  to allow users to explicitly set or create projects, and updated the
  project resolution logic to default regardless of the active
  workspace" and "Improved the terminal sandbox by granting read-only
  rather than writable access to a Git repository's `.git` directory."
  Neither describes a working-tree reset/clean/checkout side effect.
  **No changelog entry confirms or denies agy performing a git-level
  reset of the target directory on startup** — the exact wipe mechanism
  stays unconfirmed by this round, same as the item's own description
  already states.
- `fgos show tsk-3df --json` — confirms the originating observation is
  real, not hypothetical: tsk-3df's own decision log records "implement
  dispatched out-of-process (agy/gemini) ... (corrected a citation error
  the dispatched worker introduced)", i.e. the dispatched worker's own
  edits landed, but the driver's own pre-dispatch uncommitted edit to
  `plan.md` did not survive.
- `src/runner/dispatch/cli.mjs:351-355` — confirms the mechanism the bug
  report describes exactly: `executeExecutorCli(executorId, { cwd =
  process.cwd(), ... })` — no dirty-check anywhere before handing `cwd`
  to the out-of-process adapter, and no `--cwd`/`--dir` flag is passed
  from the driving loop's own dispatch call, so it silently defaults to
  the live worktree.
- `src/runner/worktree.mjs:785-855` — the existing, reusable "never
  auto-reset over uncommitted work" discipline the item's own
  description points at already exists and is concrete:
  `isDirtyRelativeToSync(repoRoot, worktreePath, lastSynced)` (`git diff
  --quiet <lastSynced> -- ':!.fgos'` plus a `git status --porcelain`
  scan for untracked `??` lines, fails closed/dirty on any unreadable
  status) gates `resyncClaimWorktree`, which **refuses loudly**
  (`WorktreeError`) rather than resetting when the target is dirty,
  citing `docs/how-to/safely-reset-the-main-checkout.md`'s discipline
  applied to a claim worktree instead. This is a real, working,
  test-covered pattern already in this codebase — not a hypothetical
  approach.
- `test/runner/dispatch.test.mjs` — exists and is the real verify
  surface for `dispatch.mjs`'s execute path (`node --test
  test/runner/dispatch.test.mjs`).

**Found (summary):**

1. Root cause of the exact wipe mechanism is NOT confirmed by this
   round (agy's own changelog gives no definitive answer either way) —
   consistent with the item's own description, which already scoped the
   fix as root-cause-independent.
2. The gap itself IS fully confirmed by direct code reading:
   `executeExecutorCli` (`src/runner/dispatch/cli.mjs:351-355`) defaults
   `cwd` to `process.cwd()` with no dirty-tree check anywhere in the
   execute path, exactly as the bug report states.
3. A concrete, already-proven, already-tested in-repo pattern exists to
   mirror (`isDirtyRelativeToSync` + refuse-loudly, `src/runner/
   worktree.mjs`) — the fix does not need to invent a new discipline.
4. A real verify command exists: `node --test test/runner/dispatch.test.mjs`.

**Still open:** whether the fix should REFUSE (mirroring
`resyncClaimWorktree`'s discipline exactly) or only WARN before an
out-of-process dispatch — a planning-stage design choice, not a
discovery-stage blocker, since the existing precedent in this same repo
already favors refuse-over-silent-loss and the item's own description
names refuse-or-warn as the open design question for planning to settle,
not a question needing a person before planning can start.
