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

1. **`mailbox send` flags and invocation model**: `mailbox send` has no `--wake`, `--from`, or `--body`. Body is a positional argument; waking is the default behavior of the send door. The sender is whoever runs the verb (derived via session identity attribution), so the suite cannot send as another head from outside. To make head X send, the rewritten suite types the send command into X with `fgos session type <X> --text "<instruction>"` and lets X's agent run it inside its own cage; then observes the result (via recipient pane or sender pane reading with `fgos session read`).
2. **`session focus` does not exist**: The valid session subcommands are `start`, `rotate`, `stop`, `write`, `read`, `type`. The fake `session focus` assertion was dropped. Focus-neutrality is checked via `herdr pane current` when herdr is available on PATH; when unavailable, focus neutrality is recorded as a manual verification check in this report.
3. **No heads started or stopped by the suite**: `session start` refuses arbitrary made-up names (planner/shaper names require an existing discussion directory, lead names require an open plan). The rewritten suite discovers already-live heads on this machine at runtime via `fgos identity list` and selects one live head per persona present. A persona without a live head is reported as skipped by name rather than passed. The `after()` cleanup that stopped heads was removed.
4. **`mailbox send --to` takes short names or handles**: `--to` accepts a session short name (e.g. `forgent-claude-62`) or a handle/role alias, not a persona name; unknown-name answers list candidate sessions. For `lead` and `planner`, `head-permissions.v1.json` restricts `--to` to `head:secretary-*` or `head:supervisor-*`, which the suite respects.
5. **Calls run with `--dir /home/vantt/projects/forgent`**: Every `fgos` call runs through the host binary or dev door with `--dir /home/vantt/projects/forgent` (e.g. `npm run fgos:dev -- <verb> ... --dir /home/vantt/projects/forgent`) because a linked worktree has no `.fgos` directory.

In addition:
- **Half-typed composer check**: `fgos session type` submits what it types and does not support typing without submitting (`--no-submit` is not a valid flag, per discussion `ds-itzp2debmh`). The half-typed composer case is preserved as a documented manual test case rather than automated via `session type`.
- **Live result status**: The suite rewrite is complete; the live execution result against real heads is pending the supervisor's unconfined run.

## Cross-machine: manual step

No second machine is reachable. Manual: on machine A run `fgos mailbox send --to <head@B> --wake --body x`; expect path
`remote-recorded`; on machine B run `fgos` sync (fetch) then `fgos mailbox inbox` as the head and see the mail. Automated by the
last live case when `FGOS_LIVE_HEADS_REMOTE_PEER` is set. Evidence so far: none live; the lower proof is `mailbox_routes` (green).

## Backlog rows

| Row | Can close now? | Evidence |
|---|---|---|
| `p-rchuoa2v3k` | Not yet | Lower-layer proofs green (permissions, forwarder, mailbox_routes), but acceptance criterion 8 (live persona send/read) was not run. |
| `p-ia2v33b54u` | Not yet | typed_wake / nudge_typed / composer vectors green; the live idle-wake and half-typed-composer cases did not run. |
| `p-bifjfd5rix` | Not yet | Cross-machine path covered only at the `mailbox_routes` layer; the live cross-machine read is a pending manual step. |

None closes on this evidence. All three can close once `npm test` is green on a writable-HOME machine and the live suite passes there.
