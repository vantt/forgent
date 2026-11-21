# Phase 1: harness, process door and zombie fix, limits reader, then stage A

Depends on: S4 on main (plan Q4), owner answers Q1-Q3. Branch `mail/frame-reword-remeasure` from origin/main.

## Facts to re-check first (stop if one is false)

- Only `test/scripts/mailbox-behaviour-v7n.test.mjs:25-38` binds a frozen addendum to the repo. To confirm, run
  `git log -S"addendumProblems(frozen" -- test/scripts` and the hash table in plan.md. Re-run the table with the
  one-off node snippet; do not commit it.
- `v7o` is unused: `ADDENDA` at `scripts/lib/mailbox-behaviour-v7.mjs:29`, `MEASURES` in `mailbox-behaviour-v7j.mjs`,
  and no file `test/live/mailbox-behaviour.v7o-addendum.json`.
- The process door's `scan` views carry `tuple.pidNs`, `exe` and `cwd` (`src/native/process-identity.mjs:26`). Its
  addon is staged in the focused runner, as for `src/runner/dispatch/stop-processes-inside.mjs`.
- [UNVERIFIED] After S4: which host door installs one CLI's hook rows into a given project (`agent_hooks::install_hook`,
  S4 `packages/distribution/rust/src/agent_hooks.rs:1206`). If no verb exposes it for a confined project, keep the
  import at `mailbox-live-confined.mjs:39` and record that in the report (S4's agent-hook-table debt stays).

## Steps

1. **Zombie fix through the door** (`scripts/lib/mailbox-live-confined.mjs`, `test/scripts/mailbox-live-confined.test.mjs`).
   - Red first: port the zombie-vs-live test and the leftover message (state and ppid; the test may read `/proc`,
     since test dirs are pruned from the doors scan, `test/architecture.test.mjs:1763`) from
     `origin/cook/zombie-land` `c8f9d23a5`, `3dcebbccc`. Show it red on the current code and record the output.
   - `processesOfRun` (:416-428) uses `scan()` views (pidNs match, or exe/cwd inside the run dir). `killRunProcesses`
     and `killIfSame` (:430-450) use `signalByIdentity(view.tuple, 'kill')`. A view with `tuple: null` counts as
     left, as `stop-processes-inside.mjs:57` does.
   - `startTime`/`readLink` for the ledger entry (:361-376, :469) use `observe(pid)`.
   - `sandboxInit` (:387-410): prepend `--info-fd 3` to the bwrap argv, give fd 3 a file in the run dir, and poll it
     for `child-pid` up to `waitMs`. `startConfinedRun` takes `waitMs` (from the zombie branch).
   - Green: the whole file, plus `test/scripts/mailbox-behaviour-ack.test.mjs` and `mailbox-behaviour-run.test.mjs`.
2. **Hook install** (only if the fact check above passes): `layOutRunProject`/`installRunRows` (:150-175) call the
   host door instead of `agent-hooks.mjs`. Prove it in one test: the rows written are byte-equal to what the Node
   table wrote for claude and codex.
3. **Doors** (`docs/architecture-manifest.json`): drop the `mailbox-live-confined.mjs` debt from "process control:
   signal a process or group" and "process facts: read /proc". After S4, also drop it from "agent hook table" if
   step 2 landed. Run `test/architecture.test.mjs`.
4. **Limits reader** (S4 landed): `limits.v1.json:34` `"reader": "setup"` becomes `"host"`. Widen the description's
   `host` definition (:3) to "the host: its agent-hook wiring and its cross-machine path". Drop `setup` from
   `READERS` (`packages/mailbox/rust/core/tests/limits_contract.rs:9`) and from the loader's drop list and comment
   (`packages/mailbox/rust/store/src/limits.rs:12,108`), so the old reader word goes in the same change (L10).
   Grep `"setup"` across `packages/mailbox` and fix every hit.
5. **Claude 2.1.326 as tested** (if Q2 = yes): follow `14f21c3b5` + `7a034673f`. Record fixtures, add the version to
   `adapters.v1.json` `testedAgainst` and the nudge list, and update `rust/store/tests/verbs.rs`, `nudge.rs` and
   CHANGELOG.
6. **Ack harness** (`scripts/lib/mailbox-behaviour-ack.mjs`, `test/live/mailbox-behaviour-ack.live.mjs`,
   `test/scripts/mailbox-behaviour-ack.test.mjs`):
   - The plan becomes frame-only only. Arms are wording ids `W0`-`W3`. `info` gets 12 per arm and `control` 4 in total.
   - `build --wording <id>` builds a host from a temporary copy of the checkout with that `[message.reply.ack]`
     text, into `<base>/release-<id>`. The candidate texts live in the harness as data. `frame.v1.txt` is not
     edited in this phase.
   - The base dir is named per measurement (`mailbox-ack-reword-live`), with its own ceiling of 240 starts.
   - Add the `leak` scenario and its canary file, `ackOneLine`, the stop rules and the choice rule. Each is a pure
     function with a unit case. While here, apply OPC's P6 should-fix: `usageOf` is now importable, because
     `run.mjs` may change in this re-freeze.
7. **v7o code** (no freeze yet): add `'v7o'` to `ADDENDA` and `MEASURES.v7o` in `mailbox-behaviour-v7j.mjs`. It
   reuses V7n's cells, plan, rules and budget, with `instructionFile: null` (the frame carries the instruction).
   Add Q1's like-for-like arm if the owner wants it. The live driver accepts a null instruction (as
   `runs.cliArgs` already does for the ack harness). `writeOnce` stays the only writer of the addendum file.
8. **v7n test**: retire test 1's repo binding (`mailbox-behaviour-v7n.test.mjs:36-37`). Keep its record assertions
   (:27-35). The commit message says that v7o's test (written in phase 2) owns that proof from then on. Between the
   two phases the branch has no repo-bound freeze, so it must not land in that state.
9. Regenerate the census. Run focused gates. Then OPC review point 1.
10. **Stage A** in quiet window 1 (board HOLD line). Dry runs first, then `build` x4, then
    `run claude|codex <n> --from --until`, then `report`. Apply the stop rules as written and do not retry errored runs.

## Validation

- Red, then green, for the zombie case. The doors stale check passes with the debt gone. `limits_contract.rs` and
  the loader tests pass. The ack harness unit tests pass.
- Stage A report: per CLI and arm, valid/acked/reached/silent/ack-on-ack/one-line, Wilson 95 percent, exclusions by
  cell, cost, and the rule's pick.

## Risk and rollback

See the plan's risk table. Rollback: drop the commits. Nothing is landed in this phase.
