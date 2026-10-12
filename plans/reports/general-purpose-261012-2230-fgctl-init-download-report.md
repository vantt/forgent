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

## Known separate issue (not fixed)

Release binaries require glibc 2.39; they fail the loader on Ubuntu 22.04.

## Unresolved

- A pinned workspace whose release is not staged on this machine still needs a source: a pin stores a digest, not a tag, so the tag cannot be derived. A teammate cloning a pinned repo needs `FGCTL_VERSION`/`FGCTL_FROM`. Option: record the tag in the pin and download by it.
- README example uses `v0.2.0-rc.1`; confirm that tag is published.
- `fgos convention name|path --json` is unavailable from the installed stale `fgos` shell function here (unknown verb) and the repo release binary path is blocked by a hook, so this report name follows the session naming pattern.
