# Plan — verb chokepoint spawn timeout (tsk-4lf)

Mode: **small** (0 Mode-gate flags fire — no auth/authorization/data-model/
audit-security/external-system/public-contract/cross-platform/multi-domain
concern, and no existing test covers `spawn_fgos_verb` today — but the fix
touches the ONE chokepoint every gateway write route funnels through and
carries a real concurrency-correctness argument (pipe-buffer deadlock
avoidance), so it gets more than a `tiny` one-line note).

## Approach

**Chosen path:** replace `spawn_fgos_verb`'s blocking `.output()` call with
a bounded wait: spawn the child with piped stdout/stderr, drain both on
separate reader threads (started immediately, same pattern
`std::process::Command::output()` uses internally), and poll
`Child::try_wait()` against a 10-minute deadline; on timeout, kill the
child, join the reader threads, and return `GatewayError { category:
Busy, .. }`.

**Why polling instead of `tokio::process` + `tokio::time::timeout`**
(`RESEARCH.md` round 1): `VerbGateway::run_verb` is deliberately
synchronous (`ports.rs:119-124`'s own doc comment) so the trait needs no
`async-trait` dependency; going async would be a materially larger,
unrelated architecture change than this chokepoint fix calls for, and
`FgosCliGateway` is the ONLY real implementor (TUI code is unreachable from
this change either way).

**Why reader threads, not a bare poll loop:** `std::process::Command::
output()`'s own documented internal behavior drains stdout/stderr
concurrently specifically to avoid a real deadlock — a child that writes
more than the OS pipe buffer (64KiB on Linux) while nothing is reading it
blocks forever, and a bare `try_wait()` loop with no draining reproduces
that deadlock for any verbose verb. This is not a hypothetical: `fgos list
--json`'s own output on a backlog this repo's size already exceeds tens of
KiB.

**Alternatives rejected** (`RESEARCH.md` round 1's own findings restated
here for traceability): making `run_verb` async (bigger, unrelated
architecture change); reusing `LockTimeout` instead of `Busy` for the
timeout category (narrower, specifically-named condition that would
misdirect a client toward investigating `.fgos/events.jsonl`'s own lock
rather than a gateway-imposed deadline).

**Scope boundary — what this item does NOT do:** the fable finding's own
suggested direction also names (a) true cancellation on client HTTP
disconnect and (b) an optional semaphore capping concurrent verb spawns.
Neither is implemented here. (a) is a materially larger, separate feature
(propagating axum's own request-future cancellation into the spawned
child) that the core reported failure mode — "one wedged subprocess pins a
blocking-pool thread forever" — does not require: once every spawn is
deadline-bounded, nothing can pin a thread past 10 minutes regardless of
client state, which already closes the load-bearing hazard. (b) is
explicitly marked optional by the finding itself and orthogonal to this
fix. Filing either as its own follow-up item is a call for whoever finds
them still worth doing later, not manufactured here per YAGNI.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| Poll-loop + reader-thread helper (new `wait_with_timeout`) | medium — real concurrency correctness (pipe-buffer deadlock avoidance, deadline math, kill-then-join ordering) | new unit tests: a genuinely long-running child (`sleep 30`) proves the kill-on-timeout path in ~100ms; a fast child (`printf`) proves the normal path still returns real stdout/status |
| Existing `spawn_fgos_verb` callers (`FgosCliGateway::run_verb`, all gateway routes via `run_verb_blocking`) | low — return type and success/error mapping unchanged, only the wait mechanism changes internally | full `cargo test --manifest-path herdr-plugin/Cargo.toml` — none of the 8 existing `gateway::tests` invoke `spawn_fgos_verb` for real (all use `FakeGateway`), so this is a regression check, not new coverage of the changed path |
| Deadline duration (600s) | low — evidenced, not guessed | `RESEARCH.md` round 1 cites `src/runner/main-checkout-lock.mjs:85-102`'s own measured ~185s single npm-ci hold, doubled for `approve`'s two-hold worst case (~370s), with real margin to 600s |

**Impact-analysis posture: degraded** (same GitNexus-present-but-zero-
indexed-symbols gap as `tsk-4uh`/`tsk-og6` for this Rust file; not
re-queried this item, cross-checked instead via `RESEARCH.md` round 1's own
direct `rg`/`Read` survey of every real caller of `spawn_fgos_verb` and
`VerbGateway`).

## Files touched

- `herdr-plugin/src/gateway.rs` — only file. No split.

## Split decision

**No split.** One honest piece: a bounded-wait helper plus wiring
`spawn_fgos_verb` through it, with two new focused tests. `fgos graph
--json`'s `criticalPath`/`topUnblock` do not include `tsk-4lf` or any
gateway-audit sibling; ordering among the 9 siblings follows the audit
report's severity ranking (Finding 3, medium, third in the queue).

## Outstanding questions

None
