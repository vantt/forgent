---
phase: 12
title: "Rust host: stop hashing the running host from inside itself, read the addon once, drop the echo provider from production"
status: pending
depends_on: ["`legacy_exec.rs` and `verify.rs` steps: none (start now)", "`apps/fgos/src/main.rs` step: shim-root on origin/main, then packaging P04 landed (writer chain)"]
parallel: "host lane; file-disjoint from every Node phase; beside P13, P14, P15"
effort: ~0.5d
net_size: "Node 0; Rust about +11 (verify +15, echo -4); tests about 0 (estimate)"
---

# Phase 12 - Host verify cost (T9-03 High, T9-20; L-7; decision 81 Q4 b)

## Context

T9-03 (High, measured): 62.5 MB is hashed on every legacy call; 55 ms of a 133 ms `--help` is host overhead (quiet machine; the baseline's 140 ms was a load figure, X8). `apps/fgos/src/legacy_exec.rs:145-150` calls `recompute_artifact_digest`, `verify_release_files` and `verify_legacy_node`; `verify_legacy_node` calls `verify_native_addon` (`packages/distribution/rust/src/verify.rs:235`), which runs `verify_release_files` again on the addon entry (`:216-220`), so the addon (16.5 MB) is hashed twice; 70 % of the bytes are the running host binary (20.2 MB) and that second read. Hashing the running host from inside itself proves nothing: a tampered host would skip its own check.

Owner decision 81 Q4 (b): **no fingerprint cache**; drop the self-hash and the double addon read, re-measure, revisit only if still slow. This is not the cache the T0 red-team warned about (L-7).

T9-20: `ECHO_PROVIDER_DESCRIPTOR` is wired into the production composition (`apps/fgos/src/main.rs:17,131`); `catalog.rs` keeps `test.fixture.echo` only for tests.

## Requirements

1. The host stops hashing its own binary from inside itself (per the arbitration the host file is verified at the stage, activation and host-admission boundaries that already call the verify door, `verify.rs:233-236`; step 1 confirms each before the self-hash goes); `verify_legacy_node` stops re-entering `verify_native_addon` when `verify_release_files` already covered the entry. Effect: about 26 MB per call, about -25 to -30 ms; every other check stays. A tampered **non-host** payload byte is still refused.
2. `ECHO_PROVIDER_DESCRIPTOR` leaves the production composition once `catalog.rs` no longer needs `test.fixture.echo` in production (existing host-runtime tests keep the fixture; **`packages/host-runtime` is not edited**, decision 81 Q3).
3. TEST (`forgent-f8`, H3) is pinged by whoever lands this.

## Files

**Create:** none.

**Modify:** `apps/fgos/src/legacy_exec.rs`, `packages/distribution/rust/src/verify.rs`, `apps/fgos/src/main.rs` (echo only; writer chain: shim-root, packaging P04, this), `apps/fgos/tests/*` (the tamper test).

**Delete:** the self-hash call and the re-entry; the echo wiring lines.

**Tests to retire:** none. If a test asserts that the addon is verified through `verify_native_addon` by name, it is re-pointed at the observable behaviour (a corrupted addon byte is refused); the owner is the existing full-verify test in `apps/fgos/tests` or `packages/distribution/rust/tests` (find by `rg -l "verify_legacy_node|verify_native_addon" apps packages --glob '*.rs'`).

## Red tests first

- Rust test in `apps/fgos/tests`: an edited payload byte (non-host file) is refused (exists for the full verify; extended to the single-read path); an edited **addon** byte is refused exactly once (call counter or a verify-trace assertion shows one read).
- Measurement before the change: host overhead per legacy call on a quiet machine (hyperfine-style loop of `fgos --help`, 30 runs, median), kept in the report.

## Net size

Rust +11 (verify +15, echo -4); no Node.

## Steps

1. Callers by `rg` of `verify_native_addon`, `verify_legacy_node`, `recompute_artifact_digest`; list every admission boundary that calls them (stage, activation, host admission) so none loses its check.
2. Measure before; red test; edit; measure after (same machine and load class). If the median saving is under 15 ms, report it plainly and leave the cache question to the owner (Q4 b says revisit only if still slow).
3. Echo removal after the `main.rs` chain slot opens.

## Validation (focused)

`cargo test -p fgos -p fgos-distribution` (names from `Cargo.toml`), private `CARGO_TARGET_DIR` on ext4; `cargo clippy -D warnings`; compile check for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin` per the land-gate memory (macOS stays supported); land gate; ping TEST.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| A boundary relied on the per-call self-hash | L x H | step 1 enumerates the boundaries; a tamper test per remaining boundary exists or is added once (named) |
| Saving smaller than estimated | M x L | reported honestly; no cache added; owner revisits |

## Rollback

Revert the merge commit and re-activate the previous release (prior id recorded in the guide).

## Done when

Red then green; before/after table in the report; TEST pinged; no `packages/host-runtime` byte changed.
