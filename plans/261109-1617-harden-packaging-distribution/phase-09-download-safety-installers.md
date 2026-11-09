---
phase: 09
title: "Download safety and installer shape: refuse http (loopback aside), cap asset size, installers in SHA256SUMS, install.sh runs only when whole, verifies the candidate"
status: completed
depends_on: ["P03 landed for the last step (candidate --version)"]
parallel: "group G1 with P03 and P05; sole writer of install.sh, scripts/install.ps1, package-release-assets.mjs until P12"
effort: ~1.25d
net_size: "shell about +100 / PowerShell about +15 / Rust about +30 / Node about +3 / tests about +100 (estimate)"
---

# Phase 09 - Safety of the download path (F5, F12, REL-06)

## Context

SEC-04, SEC-01, SEC-05, INS-02, INS-03, INS-04, INS-06, UX-08, REL-06. Evidence:
- `fetch.rs:135-139` (`is_url`) accepts `http://`; `install.sh` and `scripts/install.ps1:14` accept an `http://` `FGCTL_ASSET_BASE_URL`; no byte cap anywhere. A same-origin `SHA256SUMS` then proves nothing against an on-path attacker.
- `scripts/package-release-assets.mjs:103` checksums only the two archives, while `:104` lists the installers as assets.
- `install.sh` (206 lines) is top-level code: a truncated `curl | sh` runs the lines it got; it ends in `echo "  fgctl init"` (`:204-206`); a missing hash tool reads as "checksum verification failed"; the checksum line is the first awk match (`:129`); extraction is plain `tar -xzf` with a `find ... | head -n 1` fallback that accepts any `fgctl` (`:158-172`); the candidate is never run before `mv -f` (`:182-185`); `FGCTL_ASSET_BASE_URL` means a repo root for "latest" (`:74-75`) and an asset directory for downloads (`:102-103`).
- The consumer proof serves assets from `http://127.0.0.1:$PORT` (`scripts/ci-external-consumer.sh:121`), so loopback must stay allowed.

## Requirements

1. **Scheme rule, one meaning everywhere** (`fetch.rs`, `install.sh`, `install.ps1`): `https://` and `file://` always; `http://` only for loopback (`127.0.0.0/8`, `::1`, `localhost`). No env escape hatch (a mirror on plain http defeats the check).
2. **Byte cap per asset:** `--max-filesize` on curl (install.sh, fgctl's curl), a length check after download in PowerShell, sized from the largest real asset with headroom (step 1 measures; the audit's asset is 17 MB compressed).
3. **Installers in `SHA256SUMS`:** `install.sh` and `install.ps1` join `checksumLines` input; `fetch.rs` `find_checksum :321` and install.sh require exactly one matching entry.
4. **install.sh shape:** all code in functions, `main "$@"` last line (INS-02); `--help` exits 0; `--version <tag>` and `FGCTL_VERSION` accept `v0.2.0` and `0.2.0` and validate the tag as `install.ps1:89` does; `FGCTL_ASSET_BASE_URL` keeps one meaning (the asset directory), "latest" resolves from the default repo only, and the consumer scripts' use is updated in this change (L10); an openssl fallback and a message that names the missing tool (UX-08).
5. **Extraction:** list the archive first (`tar -tzf`), refuse absolute, `..`, link and device entries, require `fgctl` at the archive root; delete the `find | head -1` fallback (SEC-05).
6. **Candidate check:** run `"$TEMP_BIN" --version` before `mv -f`; on failure remove the temp and exit with the error (INS-06; needs P03's `fgctl --version`).
7. **Next lines:** the same three steps as P06, with the absolute `fgctl` path when the install dir is not on PATH (INS-13, ONB-12).
8. **Unsupported target:** the error names the source-build how-to (INS-03); the linux-arm64 and macOS builds stay deferred (decision 80 Q5).

## Files

**Modify:** `install.sh`, `scripts/install.ps1`, `packages/distribution/rust/src/fetch.rs` (scheme gate, `--max-filesize`, single entry), `scripts/package-release-assets.mjs`, `scripts/ci-external-consumer.{sh,ps1}` (the variable-meaning lines only), `test/install/install-sh.test.mjs`, `test/install/install-ps1.test.mjs`, `test/scripts/release-packaging.test.mjs`, `packages/distribution/rust/tests/fetch_download.rs`, `CHANGELOG.md`.
**Create:** none. **Delete:** the `find | head -1` fallback; the duplicated tag handling.
**Tests to retire:** none; any test that expects a non-loopback `http://` to work is changed to expect refusal and named in the report.

## Red tests first

`install-sh.test.mjs`: `sh -n` passes; last line is `main "$@"`; a script cut at line N installs nothing (for several N); `--help` exits 0; non-loopback `http://` refused, loopback allowed; `0.2.0` and `v0.2.0` both resolve; no hash tool -> message names it; an archive with `../x` or a symlink refused; a candidate that fails `--version` is not activated. `release-packaging.test.mjs`: `SHA256SUMS` lists both installers. `fetch_download.rs`: scheme gate and single-entry match. Why new: none of these behaviours has a test today; the PowerShell side is proven by the consumer proof in CI (`install-ps1.test.mjs` for what it can check locally).

## Net size

Shell about +100 (mostly moved into functions); PowerShell about +15; Rust about +30; Node about +3; tests about +100.

## Steps

1. Facts: measure the real asset sizes; read both consumer scripts' variable use; read `fetch.rs` target mapping for the unsupported-target text. 2. Red tests. 3. install.sh reshape. 4. ps1, fetch.rs, checksum lines, consumer variable lines. 5. Candidate check after P03 lands.

## Validation

FR `test/install/install-sh.test.mjs test/install/install-ps1.test.mjs test/scripts/release-packaging.test.mjs`, `cargo test -p fgos-distribution fetch`; `sh -n install.sh`; `scripts/ci-external-consumer.sh` locally through the file or loopback mirror; PowerShell legs run in CI.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Reshaping install.sh breaks the consumer proof or a documented one-liner | Med x High | tests first; consumer proof run locally before merge; the one-liner form `curl ... | FGCTL_VERSION=<tag> sh` is a test case |
| Byte cap too small for a future release | Low x Med | cap is a named constant with headroom; step 1 states the margin |
| The `FGCTL_ASSET_BASE_URL` meaning change surprises a mirror user | Low x Low | CHANGELOG line; consumer scripts moved in the same change |

## Rollback

Revert the merge; installers published in older releases are unchanged (they are per-release assets).

## Closes

SEC-04, INS-02, INS-04 (tag, help, one meaning per variable; the rest is an Owner idea), INS-06, SEC-01, SEC-05, REL-06, UX-08, INS-03, INS-13, ONB-12 (installer half).
