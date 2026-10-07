# Final Rust tests — single-door execution

## Summary

**176 tests passed; 0 failed, 0 ignored, 0 filtered out.** Both authorized Cargo invocations exited **0**, without timeout. This is native regression-suite evidence, not a claim that the complete installed doctor/readiness gate is green or that the execution branch has been integrated into main.

Durable combined stdout/stderr and invocation/cleanup metadata: [final-rust-tests.log](final-rust-tests.log), opened before the first command. Run window: **2026-10-06 16:25:09–16:25:22 UTC**.

## Scope and execution

Working directory: `/home/vantt/projects/worktrees/forgentX-single-door-execution`.

Commands ran sequentially in one Cargo lane:

```text
cargo test -p fgos -p fgctl -j 1 -- --test-threads=1
cargo test -p fgos-host-runtime -p fgos-distribution -j 1 -- --test-threads=1
```

- Each command had a finite **1,800-second deadline**; neither reached it.
- Cargo build jobs and Rust test threads were both limited to **1**.
- Child stdin was **DEVNULL/ignore**, preserving the Phase02/04 native-consumer contract without inheriting an open nonterminal input socket.
- Every inherited environment variable whose name starts with `CLAUDE` was removed before execution; none was present in this worker's inherited environment.
- `CARGO_HOME=/home/vantt/.cargo`, `RUSTUP_HOME=/home/vantt/.rustup`; `CARGO_TARGET_DIR` unset. The existing checkout target symlink was preserved. Cargo compiled test-profile targets as required by `cargo test`; no separate build, formatter, linter, source edit, test repinning, or bypass environment was used.

### Why the two additional packages are relevant

The workspace manifest lists `packages/host-runtime/rust` and `packages/distribution/rust`; their actual package names are **`fgos-host-runtime`** and **`fgos-distribution`**. Both are dependencies of `fgos`, and `fgos-distribution` is a dependency of `fgctl`. Testing only the application packages compiles these dependencies but does not run their own unit/integration suites.

The additional invocation therefore runs precisely these relevant workspace members, not the full workspace. It covers the separate release-manifest schema/read-boundary, canonical digest/path confinement, real release-file and legacy-entry verifier, archive/symlink refusal, host routing/admission, external-provider manifest/registry, and process-supervision regressions relevant to the changed Node distribution builder and development-layout manifest contract. Phase02/04 reports were read before running; their prior actual installed-shim and invocation-confined native-consumer evidence remains separate from this test result.

## Results

| Package / target | Passed | Failed | Ignored | Filtered |
|---|---:|---:|---:|---:|
| `fgctl` binary unit tests | 0 | 0 | 0 | 0 |
| `fgos` binary unit tests | 14 | 0 | 0 | 0 |
| `fgos` `cli_tests` integration | 20 | 0 | 0 | 0 |
| `fgos-distribution` library unit tests | 43 | 0 | 0 | 0 |
| `fgos-distribution` `schema_golden` integration | 15 | 0 | 0 | 0 |
| `fgos-host-runtime` library unit tests | 33 | 0 | 0 | 0 |
| Host-runtime fixture binary unit tests | 0 | 0 | 0 | 0 |
| Host-runtime `external_process_router_integration` | 5 | 0 | 0 | 0 |
| Host-runtime `external_process_tests` | 20 | 0 | 0 | 0 |
| Host-runtime `external_provider_manifest_and_registry` | 20 | 0 | 0 | 0 |
| Host-runtime `module_graph` | 5 | 0 | 0 | 0 |
| Host-runtime `two_projectors` | 1 | 0 | 0 | 0 |
| Distribution and host-runtime doctests | 0 | 0 | 0 | 0 |
| **Total** | **176** | **0** | **0** | **0** |

| Invocation | Exit | Timeout | Elapsed including owned-group cleanup |
|---|---:|---|---:|
| `fgos` + `fgctl` | 0 | No | 1.926 s |
| `fgos-host-runtime` + `fgos-distribution` | 0 | No | 10.758 s |

No Cargo warning or test failure appeared in the combined log. `fgctl` currently contributes **zero tests**; its successful target is not counted as exercised assertions. No ignored/filtered tests were reported. The host-runtime dispatch-drain test contains a conditional early return when `python3` cannot start, but it **did execute its real Python fixture in this run**: that fixture was observed in this lane's owned process group during cleanup, so its passing result is not treated as a silently skipped assertion path.

## Owned process-group cleanup

Each Cargo invocation started a distinct new session/process group. Cleanup inspected only those group IDs, never unrelated processes or user locks.

- Group **3031405** (`fgos`/`fgctl`): empty after command exit; no signals needed.
- Group **3031801** (runtime/distribution): two sleeping descendants remained after successful tests: Python fixture PID **3033967** and `sleep 10` PID **3033985**. Their actual argv is preserved in the log. These match the exercised drain-bound grandchildren scenarios, which deliberately retain stdout in background descendants. Sent **SIGTERM only to this owned group**; the subsequent group inspection was empty. No SIGKILL was required.

Both owned groups were empty after cleanup. This cleanup is recorded explicitly rather than treating a zero test exit as proof that every fixture descendant already exited.

## Boundaries and remaining gates

Only the two report files were created by this worker. Rust sources, test expectations, main activation, registered gateways/services, existing Phase02/04 proof roots, and user-owned main files/locks were not changed. No main init/upgrade, merge, push, or activation command ran.

No native test blocker remains. This report does **not** erase the prior Phase02 nonterminal-stdin timeout or the Phase04 whole-doctor **16 readiness failures**, does not replace the separate Node/live-consumer evidence, and does not open the PlanB barrier before actual main integration and the permanent root-hygiene test.
