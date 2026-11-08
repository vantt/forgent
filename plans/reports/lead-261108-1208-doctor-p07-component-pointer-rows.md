# Doctor readiness only, component pointer rows: lead report

Branch `harden/doctor-p07-component-pointer-rows` from origin/main `b6e474218` (includes phases 01-06 and the T6 integrate removal), worktree `/home/vantt/projects/forgent-worktrees/harden-doctor-p07`. One code commit `5e60244b0` plus this report. Pushed, not landed. Reviewers asked: ES (Event Store row), OPC (holder-lock), MAIL (mailbox row). Run-supervisor and terminal rows are HARDEN's own.

## What changed

- **Event Store.** `event-store-unsealed`, `-integrity`, `-sync` are one `event-store-incidents` row (`src/setup/event-store-checks.mjs`). It reads the status snapshot `event-store-machine-id` already read in the run, counts: unsealed age past twice the seal interval, orphan branch streams, integrity problems (errors, skipped peer mirrors, sync warnings except the shared-machine-ref one), unpublished events (remote configured, push failed or older than 24 h). Warns, never fails; zero prints "no unsealed backlog, integrity problem or unpublished event". An unreadable setup is a warning on the pointer (open-root already fails on it). `fgos events status` needed no change: `statusUseCase` already spreads the whole `store.status()` answer.
- **Holder-lock.** `predecessorProblem`, `windowsJobProblem`, hot-record judgments, the stranger-holder judgment and the lock-file enumeration (`cutOverLockFiles`) moved from `holder-lock-checks.mjs` into `src/runner/lock-status.mjs`; `collectLockStatus` answers an extra `problems: [...]` (existing keys unchanged, `bin/fgos.mjs` passes it through). `lock-holders` is a static pointer, no scan: measured scan cost is about 950 ms on 304 lock files, over the 250 ms cap, so per plan item 4 the row prints "run `fgos lock-status`" without N. `lock-kernel-semantics`, `lock-borrow-vectors`, `lock-dirs` untouched.
- **Run supervisor.** `run-attempts-stuck` is a pointer: supervised open attempts (envelope or intent present) whose lock is not held, plus units awaiting resume, "the next `fgos run` adopts them, or run `fgos dispatch recover`". No adopt spawn. `fixRunAttemptsStuck` and its registration deleted. Orphan-socket removal moved to `src/run-supervisor/runtime-dir.mjs` (`removeOrphanAttemptSockets`) and `sweepAttempts` (already called by `run.mjs:268` and `loop.mjs:1317`) calls it in the same commit that drops it from the fix; `runtime-socket-dir` keeps existence, owner, mode, size; "fgos setup creates it" became "fgos doctor --fix creates it".
- **Terminal control.** `scanTerminalAllocations` moved to `src/terminal-control/client.mjs`; `fgos dispatch inspect --terminal` (selector `terminal`, registry flag, `inspect.mjs`) returns it; `terminal-allocations` counts findings and names the verb.
- **Mailbox.** An unreadable record in `mailbox-hook` is `warning: ... run \`fgos mailbox status\`` instead of a failure (`registrations.mjs`). Opt-in states unchanged. No Rust.
- Docs naming the rows: Event Store, holder-lock, run-supervisor, terminal-control, agent-mailbox specs; packaging-distribution spec rows 7, 7b, 7e; registry contract (both inventory lines); how-to doctor table; CHANGELOG `[Unreleased]`. Census regenerated, 0 undeclared. Inventory pins: `checks.test.mjs`, registry contract.

## Condition table (old condition -> new place)

| Old | New |
|---|---|
| ES unsealed age > 2x interval (warn) | `event-store-incidents` count; `events status` `streams[].oldestUnsealedAgeSec` |
| ES unsealed age > 3600 s (fail) | warning in the pointer (decided frame item 3); same status field |
| ES orphan branch streams (warn) | pointer count; `status.orphanBranches` |
| ES integrity errors, skipped mirrors, sync warnings (fail) | pointer warning count; `status.integrityErrors`, `skippedMirrors`, `sync.warnings` |
| ES last push failed / > 24 h with unpublished events (warn) | pointer "unpublished events"; `status.lastPush`, `aheadBehind`, `streams` |
| ES no remote (info) | zero-incident text |
| Foreign holder, predecessor domain running, unknown record version, windows-job unjudged, hot record unparsable / open elsewhere / unjudgeable > 5 min (all warn) | `fgos lock-status` `problems`, same strings |
| Holders not listable (info), "machine locks not scanned" note | dropped (informational only; `lock-status` rows carry `holdersNote`) |
| Stuck attempt, no holder, no `closed.json` (fail) | pointer warning count; next `fgos run` adopts; `fgos dispatch recover` |
| Attempt whose release was removed (warn, named the paths to restore) | counted by the pointer; the named-paths text is gone: adopt's verdict via `fgos dispatch inspect --run` (`attemptState`). **Dropped text, for HARDEN to accept** |
| "attempts open but adopt could not judge" warnings | dropped with the probe spawn (pointer does not ask the host) |
| Units awaiting resume (warn, listing resume commands) | pointer count; per run `inspect`/`show-run` `resumeCommand` |
| Orphan attempt socket (fail) and its fix | `sweepAttempts` removes on every run and loop sweep; no row |
| Terminal findings (warn, listing each key and pane) | pointer count; `dispatch inspect --terminal` lists key, pane, kind, text, detail |
| Mailbox record unreadable (fail) | warning naming `fgos mailbox status` |

`doctor --fix` no longer adopts stuck attempts. `doctor --strict` stops failing on stuck attempts, ES integrity errors and an unreadable mailbox record (plan item 3; CHANGELOG names it).

## Tests retired or moved, and owners

| Retired / changed | Owner now |
|---|---|
| `event-store-checks.test.mjs` unsealed 599/601/3601 and sync cases | same file, rewritten against the pointer (warn at 601 and 3601, never fail); real status facts owned by new `verbs.test.mjs` case (age, orphan branches, integrity error, skipped mirror, sync warning) |
| `event-store-checks.test.mjs` integrity fails / peer mirror cases | `verbs.test.mjs` status case + one pointer count case |
| `holder-lock-checks.test.mjs` all lock-holders cases (foreign holder, attempt member, predecessor x3, rows scanned, five hot-record cases) | new `test/runner/lock-status.test.mjs` (assertions kept, retargeted to `problems`); one pointer case stays |
| `holder-lock/windows-doctor.test.mjs` lock-holders fresh workspace | `lock-status.test.mjs` fresh-workspace case |
| `run-supervisor-checks.test.mjs` free-lock fail, terminal attempt, fix, release-gone, mixed cases | pointer case; adopt behaviour owned by `sweep.test.mjs`, `adopt-client.test.mjs`, `inspect-recover-adopt.test.mjs`; release-gone text is a dropped judgment (see table), no owner |
| `run-supervisor-checks.test.mjs` orphan-socket cases (2) | `sweep.test.mjs` (killed supervisor removed, live and plain files kept; no socket table removes nothing) |
| `terminal-control-checks.test.mjs` stuck slot, unsupported | `client-route.test.mjs` (real fake-herdr harness: finding, closes nothing, not-scanned); pointer case with an injected port; `dispatch-runtime-inspect.test.mjs` one `--terminal` wiring case, plus a documented import-graph carve-out for the client |
| `registrations.test.mjs` mailbox record case | same assertions except the level (now a pass with a warning) |
| `one-door.test.mjs` /proc allowlist | entry moved from the checks file to `runtime-dir.mjs` |

## Net size (estimate -40 Node / 0 Rust / -20 tests)

| | Estimate | Measured |
|---|---|---|
| Node (`src`, `bin`) | -40 | -67 (+401 / -468) |
| Rust | 0 | 0 |
| Tests | -20 | +14 (+434 / -420) |

Tests miss: the moved lock-holders cases are a new 242-line file with its own scaffolding (workspace, flock holder, state root) because no `collectLockStatus` test existed; stuck-fix cases removed (-129) do not offset it. Plan total carried by other phases.

## Doctor rows and time

- Rows: the activated release answers 115 (it predates the Git cut); phase 06 left 113; this tree answers 111 (Event Store three rows become one, -2; the other four components keep their row count). Dev-host `doctor --json` includes a Cargo rebuild, so no wall-time claim; activated release before: 42.0 s (`/usr/bin/time`, one run, busy machine).
- Pointer costs measured on the main checkout state (Node 24, same process): `lock-holders` 0 ms, `run-attempts-stuck` 299 ms cold (about 50 ms open-attempt walk, about 240 ms unit walk of 425 units / 834 runs; 4 ms warm), `terminal-allocations` 238 ms, `event-store-incidents` 0 ms after `event-store-machine-id` (the first status read is 7 s on the dev build and shared; before this phase three rows reused it too), `mailbox-hook` unchanged (1.3 s, pre-existing host call). Pointers together about 0.54 s, under the 1 s cap; `run-attempts-stuck` is 49 ms over its 250 ms row cap on a cold cache. Fallback if HARDEN wants strict compliance: print the open-attempt count only and drop the unit count (the units stay readable per run through `inspect`/`show-run`).
- Real state of the main checkout: before, `run-attempts-stuck` named 1 attempt (release removed); now it reports the same 1 (280 open directories exist, 279 pre-supervisor runs with no envelope or intent, which the pointer ignores).

## Gate (ran myself)

- Focused, green: event-store-checks, verbs (event-store), holder-lock-checks, lock-status, windows-doctor, run-supervisor-checks, sweep, adopt-related, runtime-dir, terminal-control-checks, client-route, dispatch-runtime-inspect, dispatch-inspect (cli), unknown-flag-rejection, fgos-claim, fgos-claim-2, fgos-lock-fence, one-door, architecture, doc-health, check-decision-citation-drift, registrations, checks, doctor-strict-exit, agent-hooks, topologies, resume-adopts, command-routes (the help-routes cases need a release build; they passed in the full run).
- `node scripts/git-one-door-scan.mjs --root .`: 0 undeclared, census regenerated twice (after rebase).
- No Rust change: clippy, fmt, msvc and darwin checks not applicable.
- Full `node scripts/run-tests.mjs` (HERDR and CLAUDE variables unset, private ext4 target, no COOK HOLD active at start): tests 8586, pass 8552, fail 3, skipped 31, no `run-tests: ERROR` lines. Fails: the frozen V7n addendum (known) and two `provider-capacity.test.mjs` account-lock cases (known load flake; the file passes 36/36 alone).
- Smoke: orphan attempt socket removal by `sweepAttempts` is the `sweep.test.mjs` case against a real killed listener; `doctor --fix` no longer touches it by construction (the fix removes no sockets).

## Deviations and items for HARDEN

1. One code commit instead of one per component: the pre-commit census check refuses a partial staged set, and the shared files (`registrations.mjs`, `checks.test.mjs`, registry contract, `bin/fgos.mjs`, `command-registry.mjs`) carry hunks of every component.
2. `lock-holders` is a constant pointer with no count (cost cap), and `lock-status` now also scans the lock files, adding the scan cost the old row had (about 0.95 s on 304 lock files) to that verb.
3. The release-removed attempt text is dropped (see table); the other run-supervisor "could not judge" warnings go with the probe.
4. `scanTerminalAllocations` reaches `child_process` through `terminal-control/client.mjs`; the inspect import-graph test gains a carve-out entry with its reasoning (the scan observes; release is a separate operation `inspect` never calls). Reviewer eyes welcome.
5. Landing: rebase, build, stage, activate, `fgos doctor --json` expect 111 rows, `fgos lock-status --json` shows `problems`, `fgos dispatch inspect --terminal --json`, `fgos events status --json`. Owner-machine guide section needed. Rollback: revert the merge; no on-disk format change.
6. Owner-facing: `doctor --fix` stops adopting; attempts are adopted by the next `fgos run`.

## Unresolved questions

- Accept the dropped release-removed text, or keep a cheap `envelope.json` stat in the pointer (about 1 ms per supervised attempt)?
- Accept 299 ms cold for `run-attempts-stuck`, or drop the unit count?

## Follow-up after HARDEN and MAIL decisions

- **Release-removed text restored** in `run-attempts-stuck` (stat of `envelope.json` host and payload paths, remedy now says "then run `fgos run` again"); new test names the paths and checks an intact release is not blamed. The table row "attempt whose release was removed" is back: old warn -> same warn in the pointer.
- **Unit count dropped** per the plan's cost rule (pointer prints the open-attempt count only). Condition "units awaiting resume (warn)" now lives per run in `fgos dispatch inspect` / `show-run` (`unitState`, `resumeCommand`); no aggregate row. Re-measured on the main checkout: 92 ms warm; the first call in a process is 442 ms, which includes one-time native lock-probe start-up that the other doctor rows pay anyway (before: 299 ms cold, 4 ms unit walk warm). Pointers together stay under 1 s.
- **Mailbox row** (MAIL verdict CHANGES, accepted): an unreadable or untrusted record keeps failing (it stops delivery, so readiness): `enabled, but the mailbox record cannot be read: <code>; run \`fgos mailbox status\``. Table row "Mailbox record unreadable (fail)" -> unchanged fail, message now names the verb. Test assertion back to `passed === false`. CHANGELOG, mailbox spec and the `--strict` sentence updated (no longer lists the mailbox).
- lock-holders constant pointer, carve-out (left for OPC), `--fix`/`--strict`: accepted as decided.
- Gate re-run: run-supervisor-checks, registrations, checks, doctor-strict-exit, architecture, doc-health, citation-drift, sweep: 185/185 pass. Full suite from the earlier run stands for everything else (changes since are confined to these files).

## Follow-up after OPC verdict (Event Store CHANGES, accepted)

Readiness exception, next to the mailbox one: `event-store-incidents` fails (passed false) when integrity errors, skipped peer mirrors or their sync warnings count above zero; message "N integrity problem(s); run `fgos events status`" (other open counts are listed in the same message). A broken store does not heal on the normal path and `fgos events status` always exits 0, so doctor is the only failing signal (ES spec owner edge rule, section 448 area). Unsealed age (also past 3600 s), orphan branch streams and unpublished events stay warn-only. Condition table: "ES integrity errors, skipped mirrors, sync warnings (fail)" -> same fail in `event-store-incidents`; "ES unsealed age > 3600 s (fail)" -> warning. Tests: integrity error and skipped peer mirror assert `passed === false` with the pointer text. Spec fixes: the three lines that named removed rows now name `event-store-incidents` / `fgos events status`; table row, packaging spec and CHANGELOG (`--strict` still stops failing on stuck attempts only) updated. Gate: event-store-checks, event-store verbs, registrations, checks, doctor-strict-exit, architecture, doc-health, citation-drift: 186/186.

## Landing

Rebased onto origin/main (census-only conflicts, regenerated; no Git or Event Store source touched), full suite on the rebased tree: 8623 tests, 8591 pass, 1 fail (the known V7n addendum), no ERROR lines; focused 276/276 after the last rebase. Final net size against the merge base: Node -63 (+404 / -467), tests -5 excluding the baseline file, Rust 0. Suite baseline rewritten with `test-proof-inventory --write-baseline`.
