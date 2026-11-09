---
phase: 12
title: "Speed: a no-op init, repair or upgrade skips the tail and says so; the download cap stops stalls instead of capping total time; the release profile gets LTO if it pays"
status: pending
depends_on: ["P10 landed (init.rs chain)", "P09 landed (install.sh and fetch.rs chain)"]
parallel: "group G5 with P07"
effort: ~0.75d
net_size: "Rust about +30 / shell about +3 / toml about +2 / tests about +25 (estimate)"
---

# Phase 12 - Fast and light (F21, F22, RS-03)

## Context

Tier 4 with notes. Live timings (audit table): install 0.1 s, `fgos doctor` 3.7 s, `fgctl init` 15.4 s first, then 8.9 s, `repair` 9.3 s and `upgrade` 9.7 s with nothing to do, because the full tail (`init`, `doctor --fix`, `doctor`, `init.rs:565`) re-runs; `verify` 0.07 s. The 17 MB archive meets a wall-clock `--max-time 120` (`fetch.rs:47`, `install.sh:50`), so a link below about 1.2 Mbit/s cannot finish. `Cargo.toml:44-45` has `strip = "symbols"` only (the comment there explains the addon-size motive).

## Requirements

1. **No-op detection.** When the new activation digest equals the previous one (already known to the atomic publish, `previousArtifactDigest`) and one `fgos doctor --json` reports `ok`, `init`, `repair` and `upgrade` skip `fgos init` and `doctor --fix` and print `nothing to do: fgOS <tag> already active, doctor ok`. Honest target: one doctor run, about 4 s, down from about 9 s; the 0.07 s of `verify` is not reachable without a persisted marker, which would be a schema change and is not taken. If doctor is not ok the full tail runs. Pure function `is_noop(previous, new, doctor_ok)`.
2. **Download cap.** Replace the fixed 120 s total with a stall rule (`--speed-limit 1024 --speed-time 30`, connect timeout unchanged) and a generous total cap (900 s), in `fetch.rs` and `install.sh` (and the wget backstop's wrapper value) with one comment cross-referencing the two so they change together; the consumer proof exercises both.
3. **Release profile.** Add `lto = "thin"` and `codegen-units = 1` to `[profile.release]` only if the measured release build stays within about 2x of today's and the addon is not larger (the addon is read whole by every Node process). Report both numbers; revert the two lines if not.

## Files

**Modify:** `packages/distribution/rust/src/init.rs` (entry points `init_workspace`, `upgrade_workspace`, `repair_workspace`), `packages/distribution/rust/src/fetch.rs`, `install.sh`, `Cargo.toml`, `CHANGELOG.md`.
**Create:** none. **Delete:** none.
**Tests to retire:** none.

## Red tests first

`is_noop` unit tests (same digest and ok skips; same digest and not ok does not; different digest does not); a `fetch.rs` test that `CURL_ARGS` carries the stall flags and no `--max-time 120`. Timing is measured in the report, not asserted in CI (flaky).

## Net size

Rust about +30, shell about +3, toml about +2, tests about +25.

## Steps

1. Baseline timings on a scratch HOME (same load class as the audit). 2. Red tests. 3. No-op rule and cap. 4. LTO measurement, keep or revert. 5. After-timings.

## Validation

FR the Rust tests and `test/install/install-sh.test.mjs`; before and after table of `init`, `repair`, `upgrade` (no-op) and the release build time and addon size.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Skipping the tail hides drift that only `doctor --fix` would repair | Low x Med | skip requires doctor `ok`; any `warn`-only state still skips only when no `fix` is pending in `next` |
| LTO slows the CI matrix, incl. Windows | Med x Low | measured; reverted if beyond 2x |
| Two cap values drift (Rust vs sh) | Med x Low | cross-reference comment; consumer proof covers both |

## Rollback

Revert the merge; behaviour returns to a full tail every time.

## Closes

RS-03, REL-12 (SHOULD); tier 4 notes F21, F22.
