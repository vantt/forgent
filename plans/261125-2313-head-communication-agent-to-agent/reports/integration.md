# Integration report: phase 7

Tree: worktree tip `a09777829` (phases 1-6 landed). Run in a sandbox with a read-only HOME and no way to start sessions.
Nothing below is claimed green unless it says so.

## Gate

### `npm test`: NOT RUN (blocked by the sandbox)

`node scripts/run-tests.mjs` compiled the workspace, then died acquiring the full-suite queue lock:
`EROFS: read-only file system, open '/home/vantt/.local/state/fgos/locks/full-suite.lock'`
(`src/holder-lock/index.mjs:161`). No Node test ran. It must be re-run on a machine with a writable HOME.

### `cargo test --workspace --no-fail-fast`: RED, 14 test binaries failing, none in this plan's footprint

Every failure traces to the sandbox (read-only FS, git floor probe, PID namespace) or to another plan's files.

| Binary | Failing test(s) | Cause | In footprint? |
|---|---|---|---|
| `fgos` bin | 7 `wiring::doctor::confinement::tests::*` | confinement/home checks in the sandbox | no |
| `fgos --test cli_tests` | `the_execution_route_run_unit_op_refuses_an_option_outside_the_contract_and_answers_a_refused_run` | execution route message (`objective`) | no |
| `fgos --test internal_lock_routes` | 2 `quiesce_scan_*` | "scan runs inside a PID namespace that hides the host's processes" | no |
| `fgos --test migrate_portfolio` | `in_a_git_checkout_an_untracked_file_is_never_rewritten` | `git-floor-probe-failed: Read-only file system` | no |
| `fgos-component-authority --test model_checks` | `every_top_level_package_contract_file_and_every_prose_contract_has_exactly_one_row` | `packages/agent-context-engine/contracts/effective-rules.v1.json` has no row (agent-context-engine plan; the supervisor's "head-permissions row" red is not what fails here, `head-permissions.v1.json` raised no complaint) | no |
| `fgos-distribution --lib` | 5 (`source_payload`, `release_rows`, `tests::the_commit_is_...`) | git in the sandbox | no |
| `fgos-execution-engine --test confinement_cleanup` | 3 | confinement/PID namespace | no |
| `fgos-execution-engine --test planning` | `run_admission_fences_retries_and_materializes_the_attempt_directory_atomically` | sandbox | no |
| `fgos-holder-lock --lib` | `status::tests::a_holder_that_is_not_a_fgos_process_is_a_problem_and_a_free_file_is_not` | sandbox | no |
| `fgos-holder-lock --test borrow_io` | `released_lock_is_free_while_a_sibling_thread_forks_children` | fork/timing under load (the supervisor's load-only interrupt red) | no |
| `fgos-observe --lib` | 2 (`sources::repo`, `claude_transcripts`) | git/worktree in the sandbox | no |
| `fgos-run-supervisor --test head_request` | 3 `release_run_*` / `an_irreversible_recipe_*` | `git-floor-probe-failed ... Read-only file system` (release verbs, not head mail) | test file not in footprint (only `src/head_request.rs` is); cause is the sandbox |
| `fgos-work-state --lib` | 2 (`work_source`, `event_reader`) | not examined further | no |

I did not re-run the failures on a clean tree, so "sandbox cause" is read from each assertion text, not proven by a passing re-run.

### This plan's own tests: GREEN

`cargo test -p fgos-session-host -p fgos-mailbox -p fgos-mailbox-core -p fgos-identity`: every result line `ok`, 0 failed
(covers permissions, forwarder, typed_wake, record_snapshot, nudge_typed, identity directory).
Also green in the workspace run: `fgos --test mailbox_routes` (54 passed), `fgos-agent-protocol --test terminal_vectors` (13 passed).

## Live suite: NOT RUN here

`test/live/mailbox-heads.live.mjs` written; `node --test test/live/mailbox-heads.live.mjs` result: 4 tests, 0 pass, 0 fail,
**4 skipped**, reason printed: `FGOS_LIVE_HEADS=1 not set`. Even with the opt-in it would skip here (state dir under HOME is not
writable, so sessions cannot start). The suite was never exercised against real heads, so the verb flags it uses
(`session start <persona> --name`, `mailbox send --from/--to/--wake/--body`, `mailbox inbox --as`, `session focus --show`,
`session type --no-submit`, `session read`, `session stop`) beyond those the specs name are unverified and may need adjusting on
the first real run. Per-persona, idle-wake and half-typed-composer results: none.

Needed to run it: a machine with writable HOME, herdr, logged-in claude/codex/agy, then
`FGOS_LIVE_HEADS=1 node --test test/live/mailbox-heads.live.mjs`.

## Suite rewrite after the first unconfined run

The supervisor ran the initial draft unconfined against the real host and measured facts that required rewriting `test/live/mailbox-heads.live.mjs`:

1. **`mailbox send` flags and invocation model**: `mailbox send` takes `--to`, `--wake`, `--reply-to`, `--need-ack`, `--reply-by` (`apps/fgos/src/wiring/mailbox_verbs.rs`); it has no `--from` or `--body`. An earlier version of this report said there was no `--wake`; that was wrong. The body is a positional argument. Without `--wake` no wake is attempted and the path is always `local-next-tool-call`, so every send in the suite passes `--wake`. The sender is whoever runs the verb, so the suite cannot send as another head from outside: it has the sender's agent run the command in its own cage.
2. **Panes are driven with herdr directly**: `fgos session type` refuses unless a supervision event names the session and it never leaves a draft. The suite uses `herdr agent prompt <pane>` (types and submits), `herdr pane send-text <pane>` (leaves a draft, no submit) and `herdr pane read`. The sender is prompted to print only `<token>-path=<path>` (via `jq` when present, else the JSON `path` field is matched), so the agent's prose cannot match. `session focus` does not exist: focus neutrality is compared through `herdr pane list`, and recorded as a manual check when it carries no focus field.
3. **Discovery is project-scoped and alive-only**: heads come from `fgos identity list --project`; only sessions whose `projectId` equals this checkout's project id and whose `liveness` is `alive` count, the caller's own pane (`HERDR_PANE_ID`) is excluded, and the pane is `ids.terminal.paneId` (never the slot key; see "Live run 1"); a head without a paneId is skipped by name. The suite starts and stops no heads, never drives another project's head, and reports a persona or CLI without a live head as skipped by name.
3a. **Wake cases are not vacuous**: the idle-wake case requires path `local-pushed` or `local-typed`; a dropped wake (exchange quota, lifetime cap, no channel; budgeted per sender/recipient pair) fails naming the drop, and the case prefers pairs the first case did not use. The wake label is identical for every mail, so the case counts label occurrences on the recipient screen before the send and passes only on the RUN-tagged token appearing on the target screen (a count rise alone never passes). Idle heads are grouped by CLI (claude, codex, agy) and each CLI with no live head is named.
4. **`mailbox send --to` takes short names or handles**: `--to` accepts a session short name (e.g. `forgent-claude-62`) or a handle/role alias, not a persona name; unknown-name answers list candidate sessions. For `lead` and `planner`, `head-permissions.v1.json` restricts `--to` to `head:secretary-*` or `head:supervisor-*`, which the suite respects.
5. **Calls run with `--dir /home/vantt/projects/forgent`**: Every `fgos` call runs through the host binary or dev door with `--dir /home/vantt/projects/forgent` (e.g. `npm run fgos:dev -- <verb> ... --dir /home/vantt/projects/forgent`) because a linked worktree has no `.fgos` directory.

In addition:
- **Half-typed composer check**: now automated. A RUN-tagged draft is left with `herdr pane send-text`, a send with `--wake` follows, and the answer must be `local-next-tool-call` carrying the composer-not-empty refusal (`packages/mailbox/contracts/frame.v1.txt` `[report.nudge.refused]`, reason from `pane_io.rs`); the draft must still be on screen. The case is skipped by name, never passed, when the recipient uses a push channel (answer `local-pushed`, or a CLI version that is a push row), the wake was dropped (no channel, exchange quota, lifetime cap) or the recipient is busy. The draft is erased afterwards with `herdr pane send-keys <pane> Backspace ...` (status checked) and the case fails loudly naming the pane if the draft is still on screen.
- **Idle-wake case**: passes only when the RUN token appears on the target screen (a wake label count rise alone can be another sender's wake); a target that is not idle (`herdr agent get`) is skipped by name.
- **Calls and discovery**: identity calls run with cwd set to the project root; `lead`/`planner` senders pick any `head:secretary-*` / `head:supervisor-*` role of a peer.
- **Cross-machine case**: asserts only that the answer is `remote-recorded`; the read on the other machine is the manual step below.
- **Live result status**: The suite rewrite is complete; the live execution result against real heads is pending the supervisor's unconfined run.

## Live run 1

Run on p07c `ed17c8a59` against release `daaf4d83`: 3 fail, 1 skipped, 0 pass. Cause: the suite addressed herdr by the
supervisor slot key (`ids.terminal.key`, `cmd_...`) instead of the herdr pane id (`ids.terminal.paneId`, e.g. `w6:p2BE`),
so every first herdr call failed with `agent_not_found` / `pane_not_found`. This is a suite defect, not a wake-path
defect: the host typed wake resolves the slot key through terminal-control (proof:
`packages/terminal-control/rust/tests/core_failures.rs` `send_and_read_reach_the_pane_of_the_key`). Fixed in this
commit: every direct herdr call uses the paneId, a head without one is skipped by name, and every herdr failure message
names the pane id and the head label. Rerun pending the supervisor.

What the suite drives: the live heads of this project. It starts no heads (session start hands back the live holder of a
role) and sends labelled test pings that ask nothing. Test 3 leaves a draft in one live head composer and then erases it,
failing loudly if the erase does not take.

## Live run 2

Run on p07c `40f9a526c` against release `daaf4d83` (unconfined): 3 fail, 1 skipped. The herdr address fix is confirmed
(no `agent_not_found`). The failures were suite defects: (1) the fixed 20 s read window on a live LLM head, which ran the
typed send but minutes later because it was mid-turn; (2) an erase key herdr did not apply (`Backspace` exited 0 but the
draft stayed; the owner erased it by hand). Both fixed in this commit: every sender is waited to idle
(`FGOS_LIVE_HEADS_IDLE_MS`, default 300000) and then given `FGOS_LIVE_HEADS_SEND_MS` (default 180000) to report its
path, while `FGOS_LIVE_HEADS_BOUND_MS` stays the wake bound of test 2 from the moment the sender reported; the erase
tries `ctrl+u`, then `end`+`backspace`, `Backspace`, `BSpace`, records the working form, and fails loudly if none works;
test 3 drafts only into an idle, non-focused, non-secretary head. Rerun pending the supervisor.

## Live run 3

Run on p07c `fdb69362a`: 3 fail, 1 skipped. The erase form `end`+`backspace` is confirmed on pane w6:p2CE. The failures
were suite defects: typed commands that were never submitted (Enter not taken, so the sender never ran the send) and a
5 s window to read the draft. The suite now types with `herdr pane send-text`, waits for the token in the composer,
submits with a separate verified `herdr pane send-keys enter` (one retry), waits 15 s for the draft, stops at the first
failing head (later cases skip it by name), lowers the send wait to 120 s, and excludes the caller pane, panes in
`FGOS_LIVE_HEADS_EXCLUDE_PANES` and the lead of this plan (it was typed into in run 3). Rerun 4 pending the supervisor;
if it still fails for a harness reason, the supervisor records it here with the logs.

## Cross-machine: manual step

No second machine is reachable. Manual: on machine A run `fgos mailbox send --to <head@B> --wake x`; expect path
`remote-recorded`; on machine B run `fgos` sync (fetch) then `fgos mailbox inbox` as the head and see the mail. Automated by the
last live case when `FGOS_LIVE_HEADS_REMOTE_PEER` is set. Evidence so far: none live; the lower proof is `mailbox_routes` (green).

## Backlog rows

| Row | Can close now? | Evidence |
|---|---|---|
| `p-rchuoa2v3k` | Not yet | Lower-layer proofs green (permissions, forwarder, mailbox_routes), but acceptance criterion 8 (live persona send/read) was not run. |
| `p-ia2v33b54u` | Not yet | typed_wake / nudge_typed / composer vectors green; the live idle-wake and half-typed-composer cases did not run. |
| `p-bifjfd5rix` | Not yet | Cross-machine path covered only at the `mailbox_routes` layer; the live cross-machine read is a pending manual step. |

None closes on this evidence. All three can close once `npm test` is green on a writable-HOME machine and the live suite passes there.
