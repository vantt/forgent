# Phase 1: Build plumbing: static ORT at glibc 2.35, private pkm access, CI

## Context

Facts F12, F14, F15, F16 of [plan.md](plan.md). Default `ort` linking fails on Ubuntu 22.04 and would break the
release glibc ceiling. pkm is private. This phase makes every Linux build find a pinned static ONNX Runtime and lets
every build fetch pkm, before any fgOS crate depends on pkm. Blocked by owner answers Q1 and Q2; the steps below
follow the recommended options (Q1 a, Q2 a).

## Files it writes

`.github/workflows/ort-static.yml` (new), `scripts/ort-static.mjs` (new), `.cargo/config.toml` (new; a directory,
not a root file, so the root guard does not apply), `.github/workflows/ci.yml`, `.github/workflows/release-assets.yml`,
`.github/workflows/release-assets-check.yml`, `package.json` (one script entry `ort:static`).

## Steps

1. `ort-static.yml` (manual dispatch): on `ubuntu-22.04`, build ONNX Runtime 1.31.1 (the version `ort-sys rc.15`
   expects) from source as static libraries with telemetry off, merge them into one `libonnxruntime.a` the way pkm's
   `ort-build-win` does for Windows (pkm `docs/DECISIONS.md:870-886`), record its sha256, publish it as an asset of the
   tag `ort-static-1.31.1-linux-x64-glibc2.35`.
2. `scripts/ort-static.mjs ensure`: on Linux x64 only, download that asset into `target/ort-static/1.31.1/`, verify
   the sha256 pinned in the script, do nothing when present. Other platforms: no-op.
3. Point `ort-sys` at it. First try a target-scoped variable (whether `ort-sys rc.15` reads a target-suffixed
   `ORT_LIB_LOCATION` is `[UNVERIFIED]`; the local registry copy could not be read under the scout hook). Otherwise set
   `ORT_LIB_LOCATION` in `.cargo/config.toml` `[env]` (`relative = true`, `target/ort-static/1.31.1`) and unset it in
   the macOS and Windows jobs. Do not set `ORT_PREFER_DYNAMIC_LINK`.
4. `.cargo/config.toml` `[net] git-fetch-with-cli = true`.
5. CI: in every job that builds the workspace on Linux (`ci.yml` cargo jobs, `release-assets.yml` ubuntu-22.04, the
   check workflow), add the read-token git rewrite from pkm `docs/embedding.md:47-55` and `node scripts/ort-static.mjs
   ensure` before cargo. macOS `macos-host-build`: `MACOSX_DEPLOYMENT_TARGET=13.4` and the clang runtime link from
   pkm's decision. These steps are inert while no crate depends on pkm.
6. Every Linux build entry must run `ort-static.mjs ensure` first: list them while doing the step (at least
   `npm run fgos:dev`, the host build in `scripts/run-tests.mjs`, release packaging); if a shared prebuild hook exists,
   use it instead of editing each.
7. Proof link, kept out of the repo: in a scratch dir, build pkm's own `pkm` binary at v0.7.0 with the
   static lib, run `scripts/check-glibc-ceiling.sh` on it, `ldd` it, run one `pkm VAULT search` over a small vault.

## Validation

```sh
flock -o /home/vantt/projects/.doc-work/doc-heavy.lock node scripts/ort-static.mjs ensure
sha256sum target/ort-static/1.31.1/libonnxruntime.a     # equals the pinned value
# scratch proof (step 7): ceiling passes, ldd lists no libonnxruntime
```
CI: the `ort-static` run is green and its asset digest equals the pin.

## Risk

ORT source build fails or needs more libraries than one archive (re2, abseil, protobuf): handle like pkm's Windows
merge. If no static build links on 22.04, stop and return to the owner with Q1 option (c).

## Rollback

Revert the commit; the asset tag can stay. Nothing links pkm yet.
