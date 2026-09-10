# Phase 15 — CI Release And External-Consumer Proof

Depends on: Phase 13 and Phase 14 closed and merged.

## Objective

Add the `v*`-tag release workflow that builds, packages, and publishes real
GitHub release assets, plus a reusable external-consumer proof script that
both that workflow and every push on `ci.yml` run against locally served
assets — the walking-skeleton proof from outside this checkout, with no
network dependency on a real GitHub release for CI. This closes the track's
distribution surface; it is a full-suite gate.

## Requirements

- R1: `scripts/ci-external-consumer.sh` (POSIX `sh`, runnable locally and in
  CI) takes `--assets <dir>` containing `fgos-*.tar.gz`, `fgctl-*.tar.gz`,
  `SHA256SUMS`, and `install.sh`; it builds nothing itself. It starts a
  local static file server for that directory (a short `node -e` one-liner
  on `node:http` — Node is guaranteed present here and in CI, unlike
  `python3`), runs `install.sh` against it with `FGCTL_ASSET_BASE_URL`/
  `FGCTL_INSTALL_DIR`/`HOME` all pointed at fresh temp paths, then in a
  fresh `git init` temp project runs `fgctl init --from <the served or
  local fgos tarball>`, then `.fgos/installation/bin/fgos
  version --runtime-json` (an inline `node -e` JSON check asserts
  `host == "rust"` and the reported digest matches the `SHA256SUMS`-recorded
  digest for the `fgos-*` asset), then
  `.fgos/installation/bin/fgos ready --json` (asserts exit 0), then
  `fgctl upgrade --from <the same asset>` (asserts a no-op — same digest,
  `previousArtifactDigest` unchanged), then `fgctl repair` (asserts exit
  0). It stops the local server and cleans up its temp directories on every
  exit path and exits non-zero on the first failing step, naming which step
  failed.
- R2: `.github/workflows/release.yml`: `on: push: tags: ['v*']`;
  `permissions: contents: write`; one job `release` on `ubuntu-latest`:
  checkout, `rustup show`, `npm ci`, `cargo build --release --workspace`,
  `node scripts/build-rust-distribution.mjs --out dist/tree`, tar
  `dist/tree` into `dist/fgos-<version>-<target>.tar.gz` and
  `target/release/fgctl` into `dist/fgctl-<version>-<target>.tar.gz`
  (`<target>` fixed to `x86_64-unknown-linux-gnu`, the Decisions table's
  only shipped target), copy `install.sh` into `dist/`, run
  `sha256sum dist/fgos-*.tar.gz dist/fgctl-*.tar.gz > dist/SHA256SUMS`
  (paths relative to `dist/`, matching what `install.sh` expects alongside
  the tarball), assert `${GITHUB_REF_NAME#v}` (stripped of any prerelease
  suffix before comparing) equals `package.json`'s `"version"`
  (`node -pe "require('./package.json').version"`) and fail the job on
  mismatch, run `scripts/ci-external-consumer.sh --assets dist` as the
  gate, then `gh release create "$GITHUB_REF_NAME" --generate-notes
  dist/fgos-*.tar.gz dist/fgctl-*.tar.gz dist/SHA256SUMS dist/install.sh`
  (`gh` is preauthenticated via `GITHUB_TOKEN` on GitHub-hosted runners —
  no marketplace action, matching `ci.yml`'s existing "no third-party
  actions beyond checkout" stance), passing `--prerelease` when the tag
  contains `-`.
- R3: `.github/workflows/ci.yml` gains one new job `external-consumer`,
  `ubuntu-latest`, placed after the workspace cargo job Phase 04 added:
  checkout, `rustup show`, `npm ci`, the same build/package steps as R2
  minus the tag-match and `gh release create` steps (this job never
  publishes), then `scripts/ci-external-consumer.sh --assets dist`. Runs on
  the same triggers as the existing `test` job. Do not edit the `test` or
  `herdr-plugin` jobs' bodies.
- R4: Both workflow files parse with the repo's own `yaml` npm dependency
  (`package.json` already depends on `yaml` ^2.9.0 — confirmed:
  `node -e "require('yaml').parse(fs.readFileSync('.github/workflows/
  ci.yml','utf8'))"` succeeds today) — run the same check against both
  files as this cell's own syntax gate. `python3 -c "import yaml"` is a
  secondary fallback if that ever regresses; `ruby` is not installed in
  this environment and is not a fallback here. `actionlint`/`shellcheck`
  are not installed locally (confirmed) — name them as reviewer-side
  follow-ups, not part of this cell's own verification.
- R5: The Lead cuts a real prerelease tag (e.g. `v0.2.0-rc.1`) after this
  cell merges — that push, and the resulting GitHub-hosted `release` job
  run, are plan-level acceptance evidence outside this cell's own
  verification.

## Files

Likely touch:

- `scripts/ci-external-consumer.sh` (new)
- `.github/workflows/release.yml` (new)
- `.github/workflows/ci.yml` (new `external-consumer` job only)

Do not touch:

- `install.sh`, `test/install/**` (Phase 14 lease, consumed read-only)
- `apps/fgctl/**`, `packages/distribution/rust/**` (consumed via the built
  binaries only)

## Verification

```sh
node scripts/build-rust-distribution.mjs --out dist/tree
scripts/ci-external-consumer.sh --assets dist
node -e "const {parse}=require('yaml'); const fs=require('fs'); \
  parse(fs.readFileSync('.github/workflows/release.yml','utf8')); \
  parse(fs.readFileSync('.github/workflows/ci.yml','utf8')); \
  console.log('yaml ok')"
```

**Full-suite gate** — run `plan.md`'s `FULL_TEST` before merge.

- `scripts/ci-external-consumer.sh` passes locally against a hand-built
  `dist/`, covering init → `version --runtime-json` → ready → upgrade
  no-op → repair.
- Both workflow files parse via the R4 check.
- `git diff --stat .github/workflows/ci.yml` touches only the new
  `external-consumer` job.
- Capability annotation for this cell: `code:implement`.
