# Load flakes: provider-capacity account-lock test, facade-multiprocess

## provider-capacity (fixed, landed bee21556e)
- Test: "an account-lock holder killed while its probe child still runs keeps the lock until the child exits". Assertion `acquired only after the child exited` failed; the next test (own PID namespace) then failed `busy` because the failed assertion skipped `lock.release()`.
- Reproduction: node CPU hogs (stress-ng absent), load 60-95: 6/60 failed before the fix.
- Cause (proved by logging /proc/<pid>/stat at the failing instant): the kernel closes a dying process's lock descriptor before it is a zombie and before it is reaped. The lock came free while the child still answered kill(pid, 0): state=Z 11 times, state=R (exiting) once in 150 runs. A zombie-aware pidAlive alone was not enough (R case).
- Fix: assert the child left its sleep (state R/Z/X/gone), which still fails if the lock is freed early (child would be S); release in finally. No weakening, no env switch.
- After: 0 failures in 160 loop runs (100 low load, 60 at load ~95). Full suite: 8678 tests, 1 fail = known V7n addendum.
- Limit: /proc state is Linux-only; elsewhere the helper returns gone.

## facade-multiprocess (not reproduced, no change)
- 0 failures in 55 runs through run-tests at load 60-95 (15 + 40), plus the focused gate.
- The T5 closing report names it with "PID namespace / probe child", which are the provider-capacity account-lock tests (the PID-namespace and probe-child cases live there). Most likely a mislabel; no holder-lock or process code touched, so no OPC diff.
- If it fails again, capture the failure text of the full-suite run; the facade file's elapsed<3000 ms bounds on a 200 ms wait are the only load-sensitive assertions I could find.
