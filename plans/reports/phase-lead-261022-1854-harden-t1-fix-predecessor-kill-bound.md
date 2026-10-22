# R8: predecessor admission overran the 2000 ms kill wait

## Cause
`judge` (packages/holder-lock/rust/src/predecessor.rs) called `DomainWatch::kill_all()` and only then set `deadline = now + kill_wait`. On `linux-pgroup` and `macos-tree` that call waits up to `DEFAULT_EMPTY_WAIT` (5 s) for the domain to empty, so a member stuck in D state cost about 5 s + 2 s.

## Fix
- `DomainWatch::kill_all(within: Duration)`: the caller bounds the wait. `linux-pgroup`/`macos-tree` pass it to the driver's empty wait; `linux-gate` and `windows-job` return at once and ignore it.
- `judge` computes the deadline before the kill and passes `kill_wait` (the budget starts at the same instant as the deadline).
- Old signature removed (L10).

## Callers changed
- packages/holder-lock/rust/src/predecessor.rs `judge` (now passes the budget; behind a private `DomainJudge` trait so the proof can use a double at the port boundary; production impl is `DomainWatch`).
- packages/process/rust/src/lib.rs `domain_kill_all` (passes `DEFAULT_EMPTY_WAIT`, behaviour unchanged).
- packages/process/rust/src/containment/windows.rs fallback `watch.kill_all(DEFAULT_EMPTY_WAIT)` (not compiled on Linux; edit is one argument).
- `containment::pgroup_kill` / `tree_kill` helpers take `within`.
- run-supervisor adopt.rs only uses `is_empty`; no change needed. No other caller exists (grep over the repo).

## Proof
`admission_over_a_member_that_outlives_the_kill_returns_within_the_kill_wait` in predecessor.rs tests. Double: member alive for 30 s, `kill_all` blocks up to the allowed wait like a driver. Before the fix: took 5.00 s against a 300 ms kill wait (red). After: within kill_wait + 250 ms (green).
Owning proof is at the holder-lock layer; the driver mapping is a pass-through of `within` to the existing `empty_wait` parameter, already covered by the pgroup conformance tests.

## Checks
`cargo test -p fgos-holder-lock -p fgos-process -p fgos-run-supervisor` green; clippy on those crates clean for the touched code (remaining warnings are pre-existing test-helper dead code).

## Docs
holder-lock spec section 8 step 3, process spec domain primitives, CHANGELOG.

## Ideas (not done)
None.
