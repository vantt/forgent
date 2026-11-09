# mailbox_identity omp test flake

Test: `an_omp_head_renders_and_is_addressed_by_the_handle_identity_registered_from_its_ancestry_among_two_heads`
(`apps/fgos/src/wiring/mailbox_identity.rs`; lives in bin `fgos`, not a `mailbox` bin).

## Cause (test fixture only, two races)
The `Omp` fixture copied `/bin/sleep` to a file named `omp` and exec'd it.
1. `/bin/sleep` here is uutils multi-call coreutils: under the name `omp` it prints
   "unknown program" and exits 1 at once. The test passed only when the pid was read
   before the child died; otherwise `identity_of` saw a zombie (`None`, line 364) or
   `head-not-live` (402). Proof: `/proc/<pid>/stat` showed `(omp) Z`, exit code 256.
2. Write-then-exec: a process forked by a concurrent test inherits the open write fd of
   the fresh copy, so spawn fails `ETXTBSY` (line 358, 13/40 in the module run).

## Fix
`Omp` runs `/bin/sh -c 'read _'` through a symlink named `omp` with piped stdin: kernel
comm is `omp`, no file is written, no multi-call dispatch, no child left behind.

## Production
No production code writes then execs a file; a zombie head already reads as `head-not-live`
by design. No production change.

## Loops (compiled test binary, 40 each)
Before: single test 9/40 fail; module 10/40; `wiring::mailbox` 17/30.
After: single 0/40; module 0/40; `wiring::mailbox` 0/40 (18 pass).
