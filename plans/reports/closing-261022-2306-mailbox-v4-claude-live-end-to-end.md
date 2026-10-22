# Mailbox V4 closing report: Claude Code live end to end through a test-only hook entry

Date: 2026-10-22, Asia/Saigon. Branch `mailbox/v1-v3` (never merged to main). Plan: `plans/261022-1501-mailbox-v4-claude-live-end-to-end/plan.md`. V4 base `a5853a1bd`. The independent review step was skipped by the controller's instruction; the controller runs its own review.

## What V4 delivers

- **Library code in `fgos-mailbox`** that V5's host entry will wire unchanged: the hook shell (`hook::shell`: bounded stdin read, writer and head resolution, caller check, hold 1 `begin`, bodies read outside the lock, write and flush, hold 2 `finish` only after a successful write, panic caught, an entry-only budget watchdog that never cuts a started write), the CLI-neutral ancestry, topology and caller check (`head`), the Claude Code head finder from its session file (`adapters::claude_head`), and `send` / read-only `inbox` (`verbs`).
- **Core texts from the frame contract:** the delivery report, five refusal sections, the inbox listing (`fgos-mailbox-core` `report.rs`); two hook keys in the limits contract (`mailbox.hook.budgetMs`, `mailbox.hook.maxReadBytes`).
- **The test-only entry** `packages/mailbox/rust/store/examples/mailbox-test-hook.rs`, never installed, with its exit-status proof as a process.
- **The mailbox root hidden from blind workers:** `'{fgosDir}/runtime/mailbox'` in `BLIND_HIDDEN_ROOTS`, created (0700) when missing below an existing `.fgos`.
- **The live suite** `test/live/mailbox-claude.live.mjs` (never in `npm test`) with shared run guards `scripts/lib/mailbox-live-cli.mjs`: a fixed spend (a spawn marker per CLI), allowlisted environment, isolated `HOME`, version pin, Codex auth guard, a stub CLI for every dry run.

## Commits per phase

| Phase | Commit(s) |
|---|---|
| 1 Sync, preconditions, API re-check | `0d660cffb` |
| 2 Version pin and process probe | `e8346d77a` |
| 3 Mailbox root in the hidden roots | `70e02c2af` |
| 4 Contract keys, delivery report, refusal and inbox text | `dc4b90530` |
| 5 Claude head finder and caller check | `783a0d50d` |
| 6 Hook shell and the verbs | `2449dddae` |
| 7 Test-only entry and its exit-status proof | `c9b9fb2fd` |
| 8 Live Claude Code suite (and the L1 redesign) | `1e8f747a8`, `9c113fc47` |
| 9 Two live sessions (print mode, then panes) | `9781d316e`, `34066d5ca`, `ded5db44b` |
| Merge fix after main's registry change | `c4bc570ed` |
| 10 Docs, gates, closing | this commit |

Each phase ended with a merge of `origin/main` (merge, never rebase), the census regenerated, and a push.

## Tests per file (new in V4)

| File | Tests |
|---|---|
| `packages/mailbox/rust/core/tests/report.rs` | 7 |
| `packages/mailbox/rust/store/tests/head_finder.rs` | 7 |
| `packages/mailbox/rust/store/tests/head.rs` (caller check added) | 4 (1 new) |
| `packages/mailbox/rust/store/tests/hook_shell.rs` | 8 (7 behaviours and the child dispatcher) |
| `packages/mailbox/rust/store/tests/verbs.rs` | 3 |
| `packages/mailbox/rust/store/tests/test_hook_entry.rs` | 6 |
| `packages/mailbox/rust/core/tests/frame.rs` (section list extended) | 11 |
| `test/runner/dispatch-confinement-blind.test.mjs` (two owning tests changed) | 15 |
| `test/holder-lock/registry-contract.test.mjs` (mailbox row in main's registry shape) | 20 |

Crates at the end: `fgos-mailbox` 117, `fgos-mailbox-core` 106 (plus doctests), `fgos-holder-lock` 75; all green.

## Gates (fresh main `fd6540682` merged; one at a time, memory checked before each)

| Gate | Result |
|---|---|
| `cargo test --locked -p fgos-mailbox -p fgos-mailbox-core -p fgos-holder-lock -- --test-threads=4` | exit 0 |
| `cargo test --locked --workspace --no-fail-fast -- --test-threads=4` | 1531 passed, 1 failed, 11 ignored: `fgos-run-supervisor` `gate_portable` `the_agent_starts_only_after_go_and_its_output_lands_in_the_capture_files` ("the AGENT frame names the agent: tuple null"); re-run alone: 10 of 10 passed. No V4 commit touches `packages/run-supervisor`; a flake under load |
| `cargo clippy --locked --workspace --all-targets -- -D warnings` | exit 0 |
| `cargo fmt -p fgos-mailbox -p fgos-mailbox-core -- --check` | exit 0 |
| `npm test -- --test-concurrency=4` (branch) | 8724 tests, 8605 passed, 21 failed |
| `npm test -- --test-concurrency=4` (clean `origin/main`, sibling worktree) | 8721 tests, 8602 passed, 21 failed: the same 21 titles (none only on the branch, none only on main): the `fgctl` init/upgrade/repair cases of `test/rust-host/`, a codex placeholder case in `test/runner/dispatch.test.mjs`, the staged builder-selection case, and two `settleClaim` same-writer drift cases |
| `node scripts/git-one-door-scan.mjs --check` | exit 1 on the branch and on clean main alike: the same 5 `unresolved-binary` sites in `bin/fgos.mjs`, `src/runner/merge.mjs` and `src/runner/worktree.mjs` (main's census regression, left to the config lane on the board); no stale hash of a V4 file |
| `fgos convention check` on every rung file under `plans/`, `docs/`, `test/`, `scripts/` | 22 files checked, 0 violations (run through the main checkout's host; the worktree has none) |

## Live invocations: 18 CLI processes

Phase 2: 5 (Claude 4 recordings, Codex 1 dump). Phase 8: 5 (L1, L2, L3a, L3b, and the one L1 re-run the plan owner authorized after the redesign). Phase 9: 8 (D1 2, D2 2 in print mode; D3 2, D4 2 as interactive panes, after the plan owner's widened budget). No other re-run.

## What happened, in plain words

- **Live on Claude Code 2.1.308 (L1 after its redesign):** a session registered at its first hook; `inbox` listed a pending message without changing it; a message sent while a tool ran reached the model at the next tool call, and a wake message sent after the last tool reached it at the end of its turn (the Stop was blocked once, then passed); `send` answered with the right sentence for each.
- **The first L1 failed for two reasons outside the mailbox**, fixed in the harness only: Claude Code refuses `sleep N; …` in its Bash tool (the waits are now `until [ -f <file> ]; do sleep 2; done` with files the harness writes), and its shell snapshot comes from `$HOME/.zshrc`, ignoring `ZDOTDIR` (each run now has its own `HOME` holding only a link to `~/.claude`).
- **A skipped Stop hook is detected (L2)** and its mail stays recorded.
- **Output size:** Claude Code moves a `PostToolUse` context of 14 KB or more to a file and shows the model a 2 KB preview; a Stop reason of 896,700 bytes reached the model whole.
- **Two sessions talked (Minh and Lan, four short Vietnamese lines each scene):** Claude to Claude in print mode (D1, delivered; the nonce miss was an ambiguous prompt, fixed after) and in two visible panes (D3, every check passed); Claude to Codex in print mode (D2, every check passed) and in panes (D4, feasibility demo, not a support claim: turns 1–3 delivered, then the reply waited at an idle Codex that had ended its turn early; stopped at the owner's request).

## Open items

For **V5**: the product entry `fgos hook mailbox` wiring the same library functions; a size bound for `PostToolUse` context from the limits contract (Claude Code moves 14 KB and more to a file); a caller-check discriminator (a tool's `zsh` → `claude` passes the one-shell-hop check exactly like a hook's `sh` → `claude`; candidates: an `sh` parent without a tty, the stdin payload); the circuit breaker; the untested-version clause of the delivery report; `inbox --claim`; the Codex writer key from the payload in the product entry; `CLAUDE_CONFIG_DIR` for the session file through one Claude config-directory resolver shared with Observe; the new keys into config-merge.

For **a later rung (wake channel, V7 for Codex)**: an idle interactive recipient never sees a reply without wake until it runs a tool; interactive Codex 0.161.0 ended its turn instead of running scripted waits.

Board correction for the controller: the hidden root is `{fgosDir}/runtime/mailbox`, not `{fgosDir}/mailbox`.

## Evidence

Probe report `plans/reports/research-261022-1751-mailbox-v4-hook-process-probe.md`; live suite and demos `plans/reports/research-261022-1825-mailbox-v4-live-suite.md`; per-phase notes in the plan's phase files; spec `docs/platform/agent-mailbox/spec.md` (header, §4.1, §6.1, §6.2, §7.4, §11, §12, §14 V4 and V5 rows, §17).
