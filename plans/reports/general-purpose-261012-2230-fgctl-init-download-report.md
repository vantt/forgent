# fgctl init: download the release when no source is given

Branch `feat/fgctl-init-download` (from main 97ca636f9). Not pushed.

## Behavior

Source precedence: `--from` > `FGCTL_FROM` > `FGCTL_VERSION` > project pin > latest release.

- `fgctl init` with no pin and no env downloads `fgos-<tag>-<target>.tar.gz` of the latest release.
- `FGCTL_VERSION=<tag>` downloads that exact tag (pre-releases).
- `FGCTL_FROM` / `--from` accept a local path (tarball or dir) or an http(s)/file URL.
- Downloads use system `curl` (`-fsSL --connect-timeout 15 --max-time 120`), `FGCTL_ASSET_BASE_URL` and `FGCTL_TARGET` as in install.sh; latest tag resolved by following `<base>/releases/latest`. No new crate.
- SHA256SUMS is mandatory: exact file-name match, 64-hex hash, mismatch or missing entry or missing SHA256SUMS refuses with nothing staged/pinned/activated. A URL source needs a sibling SHA256SUMS; a local path is trusted as given.
- Scratch dir `${TMPDIR:-/tmp}/fgos-work/fgctl-fetch-*` (0700), removed on drop.
- Non-git directory still refuses before any network request.

## Design notes

- New module `packages/distribution/rust/src/fetch.rs` (choose_source, detect_target, fetch_release, fetch_url); `init_workspace_resolving` in init.rs resolves the source then calls the unchanged `init_workspace`. `read_tracked_pin` extracted so init and the resolver share one pin reader.
- Prior art: `git log -S` on FGCTL_VERSION / FGCTL_ASSET_BASE_URL gives install.sh (b68946c0f, 90c41a65a, bda65d3db); `--from` came with the fgctl init/upgrade phases (8e6961c26, fbecde3a5, 3ac50db7d). Reused install.sh's env names and curl bounds; nothing removed earlier needed reviving.
- Release assets are named `fgos-<tag>-<target>.tar.gz` (release.yml), tree at tarball root; install.sh's own asset is `fgctl-<tag>-...`.
- Precedence detail: an explicit source (flag/env) beats a pin; the pin then validates what was fetched (existing pin-mismatch refusal).
- `fgctl upgrade` and `fgctl stage` unchanged (path only).
- Doctor: `curl-available` check (warning only, never fails). Registered in registrations.mjs, checks.test.mjs id list, how-to doctor table, spec row 7.
- Stale text fixed: `fgos setup` deprecation string said plain `fgctl init` needs `--from` (registry + 2 tests).

## Docs

README Install, docs/how-to/install-fgos-in-a-project-and-use-doctor.md, docs/specs/distribution.md (RUL15, row 7, new "Lịch sử quyết định" section; file had none), docs/platform/packaging-distribution/spec.md (entry point + 3.1), CHANGELOG `[Unreleased]`. No component-boundary change.

## Verification

See final message for counts.

## Follow-up 1: tag recorded in the pin

- A new pin written after a download stores the resolved tag in `projectRuntime.releaseVersion` (the field already existed in the Rust struct and the pin contract, so serde and the schema goldens needed no change; `schema_golden` passes). Local/URL sources record no tag; an existing pin is never rewritten; `fgctl upgrade` writes none (it takes a path).
- Pin with a tag whose digest is not staged: plain `fgctl init` downloads that tag, checksum-verified; `init_workspace` then reconciles the fetched digest with the pin and refuses with `pin-mismatch` if different. Digest-only pin: unchanged (needs a source). A quarantined release is re-acquired the same way.
- Existing test fixture for the "pinned, unstaged, no source" refusal carried `releaseVersion: '0.1.0'`; it now uses a null tag (it is the digest-only legacy case). A pin whose `releaseVersion` is not a published tag (for example a manifest version without the `v`) will fail at download with a clear curl error.
- New tests: tag written (FGCTL_VERSION and latest), teammate flow (pin with tag, empty store and HOME, file:// base), pinned-tag digest mismatch refused.

## Follow-up 2: Rust version drift

- Cause: the Rust tests hardcoded "0.1.0" and the crates sat at 0.1.0 while package.json moved to 0.2.0. The product version the binaries report already comes from the embedded package.json; the crate version (`CARGO_PKG_VERSION`) was the stale one.
- Fix: root `[workspace.package] version = "0.2.0"`, nine workspace crates use `version.workspace = true`; the two excluded crates (`apps/fgos-gateway`, `herdr-dashboard`) carry a literal 0.2.0. Cargo.lock files updated.
- Tests now derive the expected value: lib test compares package.json with `CARGO_PKG_VERSION`; build-show test uses `resolve_package_version()`; `apps/fgos/tests/cli_tests.rs` reads package.json. The envelope vector keeps its frozen sample version (its hashes depend on it), so the parity test compares shape only.
- `scripts/prepare-release.mjs` now also rewrites those manifests and lockfiles (only files that exist) and lists them in the printed `git add`; `test/scripts/prepare-release.test.mjs` covers the rewrite and has a drift guard that fails if any Rust version differs from package.json. How-to for cutting a tag updated.
- Knock-on: `activatedBy.version` in new activation records is now 0.2.0 (`CARGO_PKG_VERSION`); no test asserted it. Release manifests do not carry the crate version. Golden fixtures in `schema_golden.rs` keep their own 0.1.0 sample data on purpose. Excluded crates cannot inherit the workspace version, hence the literals.

## Follow-up 3: full-suite regressions

- Upgrade test M1 failed because `fgctl init --from` itself wrote the build manifest's version ("0.1.0") into the pin, so a later plain init tried to download tag "0.1.0". Root cause was in my pin writer, not the fixture: only a downloaded release has a tag that can be fetched again, so a local or URL install now writes `releaseVersion: null` (digest-only pin). Hand-written pins with a bare version are read as `v<version>`, and a failed pinned download now says "pinned release X could not be downloaded" and names `FGCTL_VERSION` and `FGCTL_FROM`. Chose normalize plus clear message (both), documented in the spec and pin contract, tested in Rust (normalization) and Node (bare tag installs, unreachable pin message, local install null).
- Fixture audit: the only other pins with a non-null `releaseVersion` were the ones I wrote in `fgctl-init.test.mjs` (staged or hermetic); `fgctl-upgrade` fixtures pass a manifest version to the builder, not a pin.
- Decision-citation drift: the three RUL15 citations in `docs/specs/distribution.md` (and the one in the platform spec) now carry the gloss "(fgctl init downloads a checksum-verified release when no source is given)"; baseline untouched.
- Data Dictionary #7 parser: the `curl-available` gloss had backticked `curl` and `fgctl init`, which the checker read as check ids; the gloss is now plain text.

## Known separate issue (not fixed)

Release binaries require glibc 2.39; they fail the loader on Ubuntu 22.04.

## Unresolved

- A pinned workspace whose release is not staged on this machine still needs a source: a pin stores a digest, not a tag, so the tag cannot be derived. A teammate cloning a pinned repo needs `FGCTL_VERSION`/`FGCTL_FROM`. Option: record the tag in the pin and download by it.
- README example uses `v0.2.0-rc.1`; confirm that tag is published.
- `fgos convention name|path --json` is unavailable from the installed stale `fgos` shell function here (unknown verb) and the repo release binary path is blocked by a hook, so this report name follows the session naming pattern.
