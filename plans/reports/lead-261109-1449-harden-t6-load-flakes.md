# HARDEN: two load-only test reds fixed (owner decision 79(i))

- `test/runner/execution/run-verify-pin.test.mjs`, verify timeout case: the sleeping verify child now sleeps 120 s (was 9 s); the run-time bound is 60 s (half the sleep). Only the timeout kill can end the run early, so the bound proves the timeout fired. The `timed out after 4000ms` assertion is unchanged.
- `test/runner/worktree-admin-multiprocess.test.mjs`, 8-process case: child `waitMs` is now the test's own timeout (240 s, one shared constant), so contention waits instead of failing with lock-held. All exclusion and final-state assertions unchanged. Added, from OPC review: a `t.after` that SIGKILLs the adding children, so a failed or timed-out run leaves no orphans.
- Proof under load (own `cargo clean`+`cargo build --release` loop in a separate target, load 22 to 72): multiprocess 10/10 (load up to 59, first run 214 s wall); verify case 10/10 plus an earlier 12/12 with the first five at load 56 to 72.
- Gate: full `npm test` 8563 pass, 2 fail: V7n addendum (known red) and `case-close` "two prunes at once" (passes 15/15 alone; load flake in a Workflow test, not touched here, worth a look by the T6 owner). architecture, doc-health, citation-drift 82/82; one-door scan 0 undeclared.
- OPC verdict: MERGE on 27725d916 (before the `t.after` addition).
