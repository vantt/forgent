# Phase 00: baseline measurements

## Context

The owner asked whether containment slows the test suite (10-22 13:45). The council measured per-child cost and the census of typed operations, but not the suite. This phase records the "before" numbers that phase 05 compares against.

## Requirements

1. **Suite wall time.** Measure `npm test` and `cargo test --workspace` wall time on `origin/main` at the phase's base, 2 runs each, inside a quiet window from TEST and HARDEN. Record `uptime` per run and the run-tests ERROR lines (an exit of 1 may come from the leak or clone checks, not only from failing tests).
2. **Contained-git census of the suite.** Over one `npm test` run, count:
   - `bwrap` execs whose argv runs git;
   - plain git execs;
   - borrowed git execs.

   Use `strace -f -e trace=execve` with the log on `/dev/shm`, never on ext4. Report the top 10 test files by bwrap count. The `worktree-admin-multiprocess` file must be among the rows (R2).
3. **Micro rows.** Rerun the speed seat's harness (`.fgos/runtime/tmp/opc-speed/bench.c`, `anchor.c` not needed): plain, bwrap, plain+poll, bwrap+poll. Use n ≥ 300, interleaved, with a paired fsync probe.
4. **E3 rows.** ScopedCommit, Land, push (`scripts/git/e3-bench.mjs`), interleaved, from the E3 clean rerun method.

## Files

None changed in the repository. Scripts live under `.fgos/runtime/tmp/opc-a/` of the worktree. The report path comes from `fgos convention path --kind report --type research --slug opc-phase-a-baseline`.

## Validation

- The report states the commit, load readings, sample counts and commands.
- An expected-gain line is computed from the census: suite bwrap children × 1.4 ms (A1). It is labelled an estimate.

## Risk

- Load from other sessions skews the absolute numbers. Only interleaved deltas are compared, and the quiet window is announced and ended by message.
- strace slows the suite. The census run is separate from the timing runs.
