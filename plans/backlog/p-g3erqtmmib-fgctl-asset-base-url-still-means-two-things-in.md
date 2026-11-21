---
id: p-g3erqtmmib
title: "`FGCTL_ASSET_BASE_URL` still means two things in `fgctl` and `install.ps1`"
status: proposed
priority: P2
area: packaging-distribution
created: 2026-11-21
---

# Why

`install.sh` now takes it as the asset directory only (no version means "latest" from the GitHub repository, and a base with no version is a usage refusal), while `packages/distribution/rust/src/fetch.rs` (`resolve_latest_tag`) and `scripts/install.ps1` still ask `<base>/releases/latest` for the tag, so a mirror can answer "latest" in those two doors only.

# Done when

The three doors read the variable the same way. Proofs: in each door, one "base set, no version" test expects a refusal that names `FGCTL_VERSION` (`packages/distribution/rust/tests/fetch_download.rs`, `test/install/install-ps1.test.mjs`); the mirror-based "latest follows the redirect" tests (`latest_follows_the_release_redirect_and_downloads_that_tag`, `latest_without_a_release_redirect_asks_for_an_explicit_version`, the ps1 "without FGCTL_VERSION" case) are retired because the behaviour is removed; the Windows consumer step passes `FGCTL_VERSION`.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
