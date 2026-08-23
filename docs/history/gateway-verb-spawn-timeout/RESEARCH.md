# Research — verb chokepoint spawn timeout (tsk-4lf)

## Round 1 — 2026-08-14

**Asked:** for a fix that bounds `spawn_fgos_verb`'s subprocess wait with a
deadline, (1) can `VerbGateway::run_verb`/`spawn_fgos_verb` become `async`
to use `tokio::process` + `tokio::time::timeout` directly, (2) if not, how
to add a deadline to a blocking `std::process::Child` without deadlocking
on pipe output, (3) what deadline duration is evidenced by this repo's own
measurements, (4) what `ErrorCategory` should a timeout-kill map to.

**Checked:**
- `herdr-plugin/src/ports.rs:119-124` (the `VerbGateway` trait's own doc
  comment) — **deliberately synchronous**, stated reason: going `async`
  would need the `async-trait` crate or a hand-rolled boxed future;
  `fgos.rs`'s sibling `FgosCliSource` port already shells out
  synchronously too. `rg -n "FgosCliGateway|impl VerbGateway"
  herdr-plugin/src/*.rs` confirms `FgosCliGateway` is the ONLY real
  implementor, used ONLY by the gateway's HTTP/MCP handlers (`gateway.rs`,
  `mcp.rs`) — the TUI reads through a wholly separate port
  (`WorkItemSource`/`fgos.rs`'s `FgosCliSource`), so this fix's blast
  radius cannot reach TUI code either way. Reopening the sync-vs-async
  choice to add `async-trait` would be a materially bigger, unrelated
  architecture change than a chokepoint timeout calls for — kept
  synchronous.
- Reading `std::process::Command::output()`'s own documented behavior: it
  internally spawns reader threads for `stdout`/`stderr` while waiting,
  specifically to avoid the classic deadlock where a child blocks writing
  to a full pipe buffer while the parent blocks waiting for exit before
  ever reading the pipe. A naive `try_wait()` poll loop that does NOT also
  drain the pipes concurrently reintroduces that exact deadlock for any
  verb whose stdout/stderr exceeds the OS pipe buffer (64KiB on Linux) —
  confirmed real risk this fix must design around, not skip.
- `herdr-plugin/Cargo.toml` — no `wait-timeout`-style crate already
  present; adding a poll-loop + reader-thread helper needs no new
  dependency (`std::process`, `std::thread`, `std::time` only).
- `src/runner/main-checkout-lock.mjs:85-102`'s `DEFAULT_TTL_MS` comment —
  real measured evidence: "`mergeRunnerItem`'s long verify hold,
  `merge.mjs:660`, measured up to ~185s in practice" for ONE verify/npm-ci
  hold. The fable finding's own evidence (`tsk-1mn`) says `approve` can run
  `npm ci` TWICE inside one call (catchup worktree + merge worktree) — so a
  single `spawn_fgos_verb` call's own worst-case legitimate duration is
  bounded by roughly 2× that measured figure (~370s / ~6.2min) plus
  overhead, not the 3-minute `DEFAULT_TTL_MS` itself (a different
  consumer's window, not directly reusable here per that same comment's own
  "sized for a DIFFERENT consumer's needs" caveat).
- `gateway.rs:134-163`'s `ErrorCategory` enum + its own doc comment: "The
  one CLOSED taxonomy `src/state/store.mjs`'s `EXIT_CODES` already defines
  ... this gateway adds no categories of its own" — a locked constraint
  (D7), no new category may be invented for a timeout-kill. Checked
  `Busy`'s real existing CLI usage (`src/runner/loop.mjs:119,1120`
  `EXIT_BUSY`): means "the runner's own lock is already held elsewhere,
  retry later" — a retryable, actionable condition. `LockTimeout` means
  specifically `.fgos/events.jsonl`'s shared lock timing out — a narrower,
  different condition that would misdirect a client toward investigating
  the wrong file. `Busy` is the closer semantic fit for "the gateway gave
  up waiting and killed your still-running verb, try again" — reversible,
  easily changed later if it doesn't fit in practice (D5: pick the
  reversible option, no need to ask).

**Found:** (1) stays synchronous, no `async-trait`. (2) a `try_wait()` poll
loop MUST drain stdout/stderr on separate threads concurrently (the same
pattern `std::process::Command::output()` uses internally) to avoid a
pipe-buffer deadlock on verbose CLI output. (3) 10 minutes (600s) is a
safe, evidenced deadline — comfortable margin above the ~370s worst-case
measured for `approve`'s own double npm-ci hold, generous enough that no
lightweight route (`list`/`ready`/`graph`/etc.) ever approaches it. (4)
`ErrorCategory::Busy` for a timeout-kill, cited above.

**Still open:** none.
