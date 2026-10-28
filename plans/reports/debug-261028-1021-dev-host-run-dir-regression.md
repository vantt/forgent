# dev-host run dir regression
Cause: d4a2a0d18 keeps a run dir while a process's FGOS_HOST_BIN is inside it. Instrumented releaseRunDir (reverted): match is a real detached `node <checkout>/bin/fgos.mjs events sync --opportunistic --dir <workspace>/nested` (exe node, cwd workspace/nested, env FGOS_HOST_BIN=<checkout>/.fgos/runtime/dev-host/run-X/fgos), still running when the test checks. Legit keep, not a false positive. (Did not separately run tests at d4a2a0d18^.)
Fix: test only. settledEntries() in test/rust-host/dev-host.test.mjs polls pruneRunDirs(staleMs:0) until the run dirs reach the expected count; 5 assertions kept, now wait for the child to end. No production change.
Tests x3: dev-host + run-rust-dev-host-staging + stop-processes-inside: 17 pass 0 fail each run.
Branch harden/dev-host-run-dir-test in harden-devhost-red worktree.
