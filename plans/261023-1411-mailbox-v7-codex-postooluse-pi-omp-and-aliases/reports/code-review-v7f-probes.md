# Code review: V7f interactive wake probes, pointer-mode retirement, main merge

Reviewed 2026-10-24 (Asia/Saigon). Read-only. Branch `mailbox/v1-v3` at `bc94c5cb9`. The branch moved to `b59834601` during the review, through another main merge and a new addendum commit; neither is covered here.

I ran no real CLI, no model and no herdr command. Scratch was on ext4 under `~/projects/forgent-worktrees/rv-v7f/`, and the cargo dir was `cbuild`. `free -g` showed 21 GB available. I deleted the exports and the build dir afterwards. Kept:
- `rescore-v7c.mjs`
- `mutants-pointer.py` and `mutants-pointer.log`
- `rep-*.md` (the regenerated reports)
- `rv-walk.py` (the transcript walker)

I never read `~/.claude`, `~/.codex`, `~/.pi` or `~/.omp`. Credential files were checked by size and hash prefix only.

## Verdict

The probe records support every row of the report's part A table. The K1 finding for W7 is backed by the session record. The pointer-mode retirement is clean under L10, and the V7c, V7e and V7f measurements reproduce at their pins. The 9 merge conflicts kept both sides.

Two things stop a clean pass:
- **H1.** The merge brought in main's `fgos config migrate`. That command replaces `.fgos/config.json` with a tombstone, and the mailbox reads that file directly. After a migrate, the mailbox hook goes silent for good, and the mailbox verbs fail.
- **M1.** A mutant of the remaining pointer path survives: with the shortcut changed, mail that fits the step is never claimed.

Neither one changes the report's measured numbers.

## Critical

None.

## High

**H1. Silent semantic conflict: a project migrated by main's `fgos config migrate` loses the mailbox (CONFIRMED)**
- Ref:
  - `packages/mailbox/rust/store/src/limits.rs:196` (`read_project_config` reads `<fgos>/config.json`)
  - `apps/fgos/src/wiring/mailbox_hook.rs:94`
  - `apps/fgos/src/wiring/mailbox_verbs.rs:272`
  - `packages/config/rust/src/files.rs:12` (the tombstone)
  - `docs/platform/config/spec.md` §12 (the Rust consumer move list) and §13
- Problem:
  - After `fgos config migrate`, `.fgos/config.json` holds the text `moved to .fgos/config.yaml; upgrade fgOS`. I wrote a probe test in a scratch copy at HEAD: `read_project_config` returns `Err(Unreadable("expected value at line 1 column 1"))` for the tombstone.
  - With that error the hook returns before `hook-outcome.json` is written. Every hook call is quiet, with no trace for `status` or doctor.
  - `send`, `inbox` and `inbox --claim` fail with `mailbox config: …`.
  - A project that has only `config.yaml` gives `Ok(None)`, so its mailbox overrides there are silently ignored.
  - The Config spec's list of Rust consumers that must move (`settings.rs`, `work-state`, `herdr-dashboard`, `gateway.rs`) does not name the mailbox. It entered through this merge.
  - The report's gate (8672 passed) cannot show this, because no test migrates a project with the mailbox enabled.
- Fix:
  - Read the mailbox section through the Config crate's project snapshot, the one door, so YAML and the tombstone are handled there.
  - Until then, at least treat the exact tombstone as no source, read `config.yaml`, and make a config error leave a hook-outcome reason.
  - Add the mailbox to Config spec §12's consumer list.
  - Add one wiring test (`apps/fgos/tests/mailbox_routes.rs`): a migrated project whose `mailbox.enabled` and an override live in `config.yaml`, where the hook delivers and `send` records.

## Medium

**M1. The remaining pointer path has a surviving mutant: fitting mail starves behind too-large mail (CONFIRMED)**
- Ref: `packages/mailbox/rust/core/src/delivery.rs:526-533`.
- Problem:
  - I mutated `if picks.is_empty() && too_large > 0` to `if too_large > 0`, and every test in `fgos-mailbox-core` and `fgos-mailbox` still passed.
  - Under that mutant, a step drain whose stamp is current returns the pointer alone even when an item fits. The case is reachable:
    - two fitting items that do not fit together, plus one too-large item;
    - the first drain claims one fitting item and stamps;
    - at the next tool call the other fitting item is skipped until new mail or a time rule arrives.
  - The `picks.is_empty()` guard is right but unproven.
- Other mutants (11 in total):
  - Killed (9): M1 to M3, M6 to M11 in `mutants-pointer.log`.
  - Also surviving: `at >= newest` changed to `>` (Low, L7).
- Fix: in `packages/mailbox/rust/core/tests/`, the owner of `claim`, extend the "repeating pointer" test. With the stamp current, a fitting item left by the budget break beside a too-large item must be claimed at the next bounded step.

**M2. Retained panes have no settle door, and three live sessions still hold login copies (CONFIRMED; rotation PLAUSIBLE)**
- Ref:
  - `test/live/mailbox-wake-probe.live.mjs:372-392`
  - `mbx-wake/W2/`, `W2b/` and `W7/` `home/.claude/.credentials.json`
- Problem:
  - The harness writes "settle it after a person closes the pane", and the report says the copies "are settled when the panes are closed". No code does that: there is no `settle` verb and no sweep.
  - At 12:31 these were still running from the probe directories, 2.5 h after launch:
    - `claude` pids 2710121 (W2, bypass), 2715146 (W2b, bypass) and 2757393 (W7, prompting);
    - each one's pane `zsh`.
  - All three copies are 559 bytes, share hash prefix `ff8f560bab32dfc9`, and are unchanged since they were copied.
  - W7's session still refreshes its policy and remote settings: mtimes at 12:05.
  - When the access token expires, an idle session's background fetch could refresh it. With a rotating refresh token, that could end the owner's own login.
- Fix:
  - Add `run … settle <probe>` (or a `report` step) that refuses while the pane or any process from the probe directory lives, then calls `confined.settleCopy`.
  - Ask the owner to close W2, W2b and W7 now. W7's question is answered, and W2 and W2b only show a held dialog.

**M3. K1 conclusion reaches past what W7 measured (PLAUSIBLE)**
- Ref: report lines 176-179.
- Problem:
  - W7's evidence is sound for its setup:
    - the first record of the session's transcript is a `user` record with `isMeta: true`, `origin: {kind: peer, from: unknown, verifiedPeerPid}`, inside the "Treat it as a teammate's request" frame;
    - the first model output came 1,248 ms after the write, and the screen read 4 s later showed no dialog;
    - `permissionMode: default`;
    - `settings/W7.json` has no `crossSessionInbound`, and neither has the private home;
    - `remote-settings.json` is `{}`, `policy-limits.json` has no such key, and `/etc/claude-code` is absent.
  - But the session ran with `--setting-sources project` and a private HOME, so it read no user settings. It is one fire into a session that had never taken a user turn (its first prompt was swallowed).
  - "Any default-mode, prompting Claude Code session on this machine today" also covers the owner's real sessions. Those load `~/.claude/settings.json`, which nobody checked; I did not, by the hard limit.
- Fix:
  - State the measured scope: no setting in managed, `--settings` or user settings, one fire, a fresh session.
  - Have the owner check their own user settings for `crossSessionInbound`.
  - If phase 11 or a K1 decision rests on it, repeat W7 with the fixed argv in a session that has taken a turn.

## Low

**L1. W2b's record does not keep the wire line (CONFIRMED).**
- `result.json` has no `socketLine`, so the record alone cannot show that `from_mode` was sent.
- The code that sent it (`a6ef3a672`, 04:56) predates the run (10:01), and the dialog wording is the same as W2's. The finding that the claim was not honoured is consistent, but it is not directly evidenced.
- Fix: record the exact line written in `result.fired`.

**L2. W3 rerun row: "recorded 0.2 s after the write" is not in the record (CONFIRMED).**
- The transcript's `queue-operation enqueue` and the `attachment:queued_command` carry timestamps 10 ms after `fired.at`.
- Fix the wording, or name the source of the 0.2 s.

**L3. W6 "Mail claimed: yes" leaves out what the report says for W3 (CONFIRMED).**
- In W6 the PostToolUse hook delivered the hello as a `developer` message inside the running turn, 44.8 s after the fire. The model answered "Mail was a benign hello" before the queued turn started.
- So the queued turn's claim found the mail already taken.
- W5's 10.7 s latency also hides an 8.5 s gap between `codex queue` returning and `task_started`.
- Fix: say both in the row.

**L4. Identity was never reached in any probe (CONFIRMED).**
- Every probe's `ws/.fgos/runtime/mailbox/hook-outcome.json` reads `ident:machine-id-missing`, because the private HOME has no machine id.
- Frames show `handle="unregistered"`. Delivery worked by mailbox binding alone.
- Fix: list it under Limits, or seed a machine id into the private home for later probes.

**L5. Stale report and spec text (CONFIRMED).**
- The report frontmatter `description` still says part A is "waiting for the owner". So do spec line 620's heading and the V7f decision row (spec line 765).
- Gates line 200, "No Rust changed; `cargo test` is not rerun", contradicts the line above it (Rust 566 passed) and the retirement's Rust deletions.

**L6. The W7 argv fix is proven by a unit test only (CONFIRMED).**
- `test/scripts/mailbox-wake-probe.test.mjs:36` checks the argv shape.
- No real run used the reordered argv. The W3 rerun at 10:41 still had the prompt last, and the reorder landed in `e341074a5` at 10:43.
- Related provenance gaps:
  - `result.json` records no harness commit.
  - The W3 rerun's `--attempt` pane key ran from an uncommitted tree.
  - W7's same-session fire came from `v7f/probes/scripts/w7-fire-same-session.mjs`, which is in neither the repo nor the report.
- Fix: write `git rev-parse HEAD` plus a dirty flag into each `result.json`, and cite the W7 script.

**L7. Second survivor: the equal-timestamp boundary (CONFIRMED, benign).**
- Changing `at >= newest` to `at > newest` survives.
- Its only effect is one extra snapshot write when a message and a drain share a millisecond.
- Fix: add one assertion, or accept it and note it.

**L8. Dead pointer config in frozen modules (CONFIRMED, harmless).**
- `scripts/lib/mailbox-behaviour-v7f.mjs:83` `PROJECT_CONFIG` and V7c's `ARMS.P.config` still write `pointerClis`, and `test/scripts/mailbox-behaviour-v7f.test.mjs:54` asserts it.
- At HEAD the key is ignored. The `context()` freeze check (`frozen files changed`) refuses every run, because the hashes of `limits.v1.json` and `frame.v1.txt` changed, so nothing can silently measure without pointer mode.
- Fix: add one comment beside `PROJECT_CONFIG` saying it is historical and refused at HEAD.

**L9. "The harness typed nothing into any pane" holds only after launch (PLAUSIBLE).**
- The Terminal Control launch goes through `herdr pane run` (`packages/terminal-control/rust/src/driver/herdr.rs:561`). That types the `env -i <allowlisted env> <cli> …` line into the pane's shell, so it lands in that shell's history.
- Fix: say so in the report. The bar's "no typed input" concerns the wake, which this does not change.

Out of scope: the CHANGELOG's `Identity reads PI_SESSION_ID…` line appears 3 times in `[Unreleased]` on both merge parents. It predates this merge.

## Checked and holding

**Part A table against the records** (`~/projects/forgent-worktrees/mbx-wake/W*/result*.json` and each session's transcript or rollout):

| Probe | Latency | Turn and carrier | Dialog | Focus | Login |
|---|---|---|---|---|---|
| W1 | 1,986 ms | `user` record with peer origin | none | `w4:p3B` before and after | unchanged, removed |
| W2 | - | no turn: one system `informational` "Held peer message … not delivered" | held-message dialog | `w4:p3B` before and after | kept with the pane |
| W2b | - | no turn: the same held message | held-message dialog | `w4:p3B` before and after | kept with the pane |
| W3 rerun | 48,419 ms | `queued_command` attachment; the hook's `additional_context` held the frame at +44.9 s; the model's claim then returned "No pending mail." | none | `w4:p3B` before and after | unchanged, removed |
| W5 | 10,746 ms | `message:user`; `daemonStop` 0 | none | `w4:p3B` before and after | unchanged, removed |
| W6 | 48,678 ms | `task_started` 2 ms after `task_complete`, nudge 5 ms after | none | `w4:p3B` before and after | unchanged, removed |
| W7 | 1,248 ms (same-session fire) | `user` record inside the peer frame | none | `w4:p3B` before and after | kept with the pane |
| W9 | 3,774 ms | `message:user` | none | `w4:p3B` before and after | unchanged, removed |
| W10 | 3,871 ms | `custom_message` | none | `w4:p3B` before and after | unchanged, removed |

- W4: the session file read `idle` at the fire in W1, W2, W2b and W7, `busy` in W3, and `waiting` while the dialog was open.
- Deviations: the first W3 is kept and reported honestly. W7's original `result.json` shows registration timed out (argv swallowed). W9 started at 10:40, about 35 minutes after W7, which fits the reported wait.

**Safety**
- `crossSessionInbound` appears only in `mbx-wake{,-dry}/settings/W1.json` and `W3.json`, both passed by `--settings`. It is in no private home.
- `/etc/claude-code` does not exist. Every probe ran with a private HOME and `--setting-sources project`, so a global value could not have applied. I did not read `~/.claude`.
- The only non-stub credential files left are W2's, W2b's and W7's. `login-read` for W9 and W10 is empty, and W10's omp profile has no `agent.db`. The `auth.json` files under `v7e/probe/runs/pi-*` are stubs (`refresh: FAK…`, a 119-character `e30…` token).
- No `codex` process is running, and none has a `CODEX_HOME` under `mbx-wake`.
- The only processes with a cwd under `mbx-wake` are the 3 retained `claude` heads and their pane shells.

**Pointer-mode retirement**
- `git grep` at HEAD outside history, plans and frozen modules finds no `pointerClis`, `[message.pointer]`, `mode_pointer`, `Pointed`, `PointerReason`, `PostToolUseLimits` or `same_kind`.
- Every default the hook and core readers take is an unsigned integer, so the loader's integer-only match is safe.
- A config naming the retired key loads, and the key is reported. The owning proof is `packages/mailbox/rust/store/tests/limits_loader.rs:48`, and `mailbox_verbs.rs:276` warns on stderr.
- The too-large pointer stays. Baseline: all `fgos-mailbox-core` and `fgos-mailbox` tests are green.
- `POINTER_NEEDLE` equals the pin's frame text after `{{count}}`.
- All 110 V7c runs rescore identically from their kept rollouts with the HEAD scorer and with the pin scorer: outcome, `channelSeen` (arm P), `pointerRepeats` and `claimRan`. F-arm outcomes were not rescored, because results do not keep `sentId`.
- `report --addendum <x>` was regenerated from copied `results.jsonl` files:

| Measurement | At its pin compared with HEAD | Against the written result |
|---|---|---|
| V7c (`15a173c26`) | identical | - |
| V7e (`96928fe1e`) | identical | matches the V7e report's table (pi LW 2/10, omp 5/10) |
| V7f (`2a16ce1b7`) | differs only by the L1 fix's wording "meets the part B bar at N" | the pin's report is identical to `v7f/logs/v7f-report.md` |

- Narrow Node suites at HEAD (v7, v7f, wake-probe): 26 of 26 pass.

**Main merge `9993276f1`**
- I replayed the merge in a scratch clone. It gives exactly the 9 conflicts: CHANGELOG, `cli_projector.rs`, `main.rs`, the census, `catalog.rs`, `command-registry.mjs`, `confinement/resources.mjs`, the flag-drift test, and `envelope/version.json`.
- Each resolution keeps both sides:
  - The projector holds the five mailbox mappings and `config.read|write`. `native_operation_id` fans out both.
  - `main.rs` has both descriptor sets and providers.
  - The catalog asserts 16 entries with both id sets.
  - The registry has both entries.
  - `resources.mjs` has both `createBlindRootsWhenMissing` and `MACHINE_PRIVATE_ROOTS`.
  - The drift test lists `config` and `mailbox`.
- The envelope vector's verbs include `config` and `mailbox`, and `data_hash` equals the sha256 of `compact_hash_input`.
- All 1203 census file hashes match the HEAD tree.
- `command-routes.json` (auto-merged) has both native routes.
- The silent conflict is H1.

## Recommended actions

1. H1: put the mailbox's project config read behind Config's snapshot, or at least handle the tombstone and `config.yaml`. Add the migrated-project wiring test, and add the mailbox to Config spec §12.
2. M2: ask the owner to close W2, W2b and W7, and add a settle step for retained panes.
3. M1: add the starvation test, which kills the surviving mutant.
4. M3: narrow the K1 sentence, and have the owner check their user settings.
5. L1 to L6: corrections to the report and the record.

Status: DONE_WITH_CONCERNS
Summary: The probe records support the report's table and the K1 finding for W7. The pointer retirement is clean and the pins reproduce. The merge kept both sides in all 9 conflicts, but it silently breaks the mailbox in any project migrated by the new `fgos config migrate` (H1).
Concerns/Blockers: H1 should be fixed or recorded before phase 11 relies on the merged tree. The three retained probe sessions still hold login copies, and nothing settles them.
