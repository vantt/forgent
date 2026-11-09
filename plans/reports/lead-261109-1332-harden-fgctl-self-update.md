# HARDEN lead report: fgctl ships in the release and refreshes itself on upgrade

Date: 2026-11-09. Owner decision 79(iii) (plans/261021-1118-harden-low-layers-bottom-up/plan.md). OPC (forgent-5f) review: CHANGES (store-write), fixed, then MERGE on 9aafc072d..ea8e17d87 (rebased as 488590468..e3dbbb708).

## Problem
`fgctl` was installed once by install.sh and nothing replaced it; a release upgrade left the machine fgctl stale (fg-server2 ran the 11-08 build without --override-pin, swapped by hand, old kept as ~/.local/bin/fgctl.bak-261108).

## Prior art and reuse
- `git log -S'fgctl'` on the builder and manifest: no earlier self-update.
- The host binary is `entries.fgos` with its digest in files[]; fgctl takes the same shape (`entries.fgctl`, optional, skip_serializing_if none so historical digests are unchanged). `components.runner` was never written by the builder.
- Verification reuses `verify_release_files` (symlink/escape/digest) and `recompute_artifact_digest`; writes reuse `fgos_durable_file::replace_durably_with_mode`.

## Change
- `scripts/build-rust-distribution.mjs`: stage `bin/fgctl` (`bin/fgctl.exe` on Windows), `entries.fgctl`.
- `scripts/package-release-assets.mjs`: fgctl asset is taken from the release tree (was target/release, which ignored CARGO_TARGET_DIR), so install.sh and upgrade install the same bytes.
- `packages/distribution/rust/src/manifest.rs`: `fgctl_file()` in validate_v1_invariants.
- `packages/distribution/rust/src/fgctl_refresh.rs`: refresh after upgrade (no-op upgrade included). Equal bytes write nothing. Unix: old bytes durably to `<path>.prev`, new bytes renamed over the path. Windows: rename-away then install, rename back on failure. Refusals: fgctl-release-unverified, fgctl-inside-release-store, fgctl-not-writable (prints `install -m 755 ...`), fgctl-replace-failed; exit 1 after saying the activation stands.
- `apps/fgctl/src/main.rs`: upgrade calls it with current_exe; a replacement names the project whose activation chose the machine-wide fgctl.
- init and repair never refresh (a pin or rollback could downgrade the machine fgctl).

## Proofs
- fgctl_refresh unit tests (6): stale replaced + .prev; tampered release fgctl refused, untouched; manifest not matching the activation refused; equal digests write nothing (mtime kept); fgctl inside the release store refused, store byte-for-byte unchanged; unwritable dir refused with manual command.
- Wiring: A to B case of test/rust-host/fgctl-upgrade.test.mjs runs a stale copy and asserts replacement + .prev.
- release-tree.test.mjs: entries.fgctl, mode, digest equal to the built fgctl. schema_golden: path/files[] invariant, historical digest unchanged.
- Fixture fix: test/distribution/native-addon.test.mjs fake target now has an fgctl.

## Gate
cargo fmt, clippy -D warnings (fgos-distribution, fgctl), cargo test both crates, msvc + aarch64-apple-darwin check clean for touched code. One-door scan 0 undeclared, census regenerated. Focused JS 156/156 after the last code rebase; architecture/doc-health/citation-drift/release-tree/native-addon 92/92 on the landing tip. Full npm test (pre-fixture-fix tip): 8595 tests, 3 fail: V7n addendum (known red), mailbox-live-confined (known flake, 19/19 alone), native-addon (fixture, fixed, 6/6 alone).

## Docs
Packaging spec RUL110 + decision history; release-manifest contract section 9; activation-binding section 10 (incl. concurrent-upgrade note); recovery runbook; CHANGELOG. No doctor row reports the fgctl version, none added.

## Not done / follow-ups
- Machines get this with the next release; the first upgrade from a release without fgctl prints "ships no fgctl".
- RUL110 picked as the next free number (rule ids have no mint door).
