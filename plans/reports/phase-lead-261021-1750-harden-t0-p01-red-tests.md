# Phase lead report: red tests for the seven High defects

Branch `harden/t0-p01-red-tests` (worktree `.claude/worktrees/harden-t0-p01`), 8 commits on `8af4c41ea`. Tests only; no production file touched.

Run command (one file or several; `scripts/run-tests.mjs` itself runs the whole suite). `run-one.mjs` is the phase's one-liner kept in a scratch file, with `cwd` set to the worktree so the addon is staged from it:
`CARGO_TARGET_DIR=/tmp/fgos-work/harden-t0-p01-target node <scratch>/run-one.mjs <test files> </dev/null` (env without CLAUDE_CODE_SESSION_ID, CODEX_THREAD_ID, FGOS_SESSION_ID). `runSelectedTests(files, {env, cwd})` returns `{status}`; it worked as the phase described.

| High | Test (file:line) | Red / pin | Result I saw | Closest existing test, why it did not own it |
|---|---|---|---|---|
| F-A1+RT-M4 foreign pid | `stopGateway never signals a process that is not the recorded gateway...` `test/runner/gateway-control.test.mjs:255` | red | `the unrelated process must not receive any signal: false !== true` (child killed) | `a live pid is genuinely SIGTERM-ed` (:200): only the recorded process, no identity |
| RT-M4 start | `startGateway reports an immediate exit within one poll...` `:281` | red | subprocess hit the 6 s cap: `startGateway did not return within 6 s (ETIMEDOUT)` | `two concurrent starts` (:394): a binary that stays up |
| RT-M4 stop | `a gateway that is already a zombie is dead at once...` `:321` | red | `alreadyStopped` false (`false !== true`); the run took 10.07 s | `a dead-pid registry entry is cleared` (:~190): a vanished pid, not a zombie |
| F-A3 | `processesInside names the identities it finds ({pid, startTime})...` `test/runner/stop-processes-inside.test.mjs:19` (new file, no owner existed) | red | `found entries must carry identity, got [1330046]` | none; callers' tests only see the directory deleted |
| RT-M3 | `fenceHotRecord on a holder that died between judge and signal...` `test/cli/fgos-lock-fence.test.mjs:240` | **pin, green on Linux (see below)** | passes in 18 ms | `lock fence state: ... a live holder is ended by --yes` (:~190): never kills the holder mid-fence |
| RT-M5 | `the cancel request's self tuple uses the pidNs form...` `test/run-supervisor/cancel-registry.test.mjs:74` | red | `'4026531836' !== 'pid:[4026531836]'` | `a request names who asked` (:58): pid and attempt only |
| RT-M5 (bootId half) | `every envelope deadline carries a string bootId on every platform` `test/run-supervisor/direct-cutover.test.mjs:98` | pin, green on Linux, red on Windows (Windows not run) | passes | the envelope case at :117 compares createdAt and softAt only |
| RT-M1 | `spawn_in_never_makes_the_caller_a_subreaper` `packages/process/rust/tests/containment_pgroup.rs:171` | red | `cargo test -p fgos-process --test containment_pgroup spawn_in_never_makes_the_caller_a_subreaper`: FAILED, `spawn_in made the calling process a child subreaper` | `containment_pgroup_record_alone_judges_and_ends_the_domain`: never reads the flag |
| RT-M2 | `pgroup_state_reports_unknown_when_a_seen_member_cannot_be_judged` `packages/process/rust/src/containment/linux.rs:590` | red | `cargo test -p fgos-process --lib pgroup_state_reports_unknown`: `left: Empty, right: Unknown` | `unreaped_fast_child_keeps_its_identity`, `reaped_gate_tombstone_...`: leader only |
| RT-M2 macOS twin | `tree_state_reports_unknown_when_a_seen_member_cannot_be_judged` `.../containment/macos.rs:286` | **not compiled or run** (only x86_64 linux and windows targets installed) | n/a | none in the file |
| S-E1 / one door | `test/process/one-door.test.mjs:82, :86, :90` | red (2 cases), third case green | process.kill list: fences:100, hold-transport:53, provider-credential-renewal:707, run-lock:37, stop-processes-inside:22,64,70, gateway-control:292,307, lock-fence:75, registrations:5510,6021,6063,6116. /proc list: stop-processes-inside:48,49, lock-fence:50,61, registrations:6059. This matches the plan's Facts list. | `test/git/one-door.test.mjs`: scans git spawns only |

S-E1's policy proof `process-facts-vectors.test.mjs:72` is untouched, as the phase says.

## Things that differ from the phase text

1. **RT-M3 does not reproduce as written.** A record whose holder was killed and reaped before `fenceLock` ran gives `attested-free` in 6 ms, and a holder killed inside `confirm` (after the identity read) also clears at once. A zombie holder is judged dead too. The `null === null` defect needs the holder to die in the microseconds between `judgeHotRecord` and `identityOf` (no await in between), which cannot be set up from outside without a race. I committed the phase's named case as a pin (green) with a header comment saying so; the defect's proof needs a seam the fix creates (phase 2/3 moves identity capture to the record's own start time). The "today 8 s" claim in the phase is not reproduced by what I ran.
2. The RT-M1 case re-runs itself in a fresh process of the same test binary (env marker plus `--exact --test-threads=1`) because the subreaper flag is process-wide and sibling tests in the binary run in threads of one process; run directly it would be green or red depending on test order.
3. The RT-M2 Linux test went into the existing `mod tests` of `linux.rs` rather than a second appended module. The macOS module is new and uses an unreaped-then-reaped child plus a foreign-host tuple.
4. The one-door scan carries its own small comment stripper (the git lexer scans git spawns, not these primitives); a third case fails when an allowlisted file no longer holds a site.
5. The gateway start case runs `startGateway` in a subprocess with a 6 s cap so a red run costs seconds, not 30 s; it uses a `cargo` shim script on PATH as the existing concurrent-start case does.

## Delta

- Node production 0, Rust production 0.
- Node tests: 10 cases added in 7 files (2 new: `stop-processes-inside`, `one-door`): 3 gateway, 1 stop-processes-inside, 1 lock-fence, 1 cancel-registry, 1 direct-cutover, 3 one-door; about +320 lines.
- Rust test code: +67 lines (35 in `containment_pgroup.rs`, 13 in `linux.rs`, 19 in `macos.rs`).
- Not run: the full suite, the macOS test, Windows halves, `mutation-census.v1.json` (git status clean after each commit; no regeneration was needed).

## Not done / unproven

- RT-M3's actual window (item 1), the macOS twin, the Windows red of the bootId pin, and the gateway "survives SIGKILL" branch (phase text says documented as unproven).
- No red test was executed together with the rest of its files beyond those named above.
